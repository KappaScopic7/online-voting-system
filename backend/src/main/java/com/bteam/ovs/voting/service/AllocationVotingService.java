package com.bteam.ovs.voting.service;

import com.bteam.ovs.candidates.repository.CandidateRepository;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.elections.service.ElectionEligibilityService;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.shared.identity.CitizenIdResolver;
import com.bteam.ovs.voting.controller.dto.AllocVoteConfirmRequest;
import com.bteam.ovs.voting.controller.dto.AllocVoteHistoryItem;
import com.bteam.ovs.voting.controller.dto.AllocVoteStartResponse;
import com.bteam.ovs.voting.entity.VoteAllocCast;
import com.bteam.ovs.voting.entity.VoteAllocCurrent;
import com.bteam.ovs.voting.entity.VoteAllocItem;
import com.bteam.ovs.voting.repository.VoteAllocCastRepository;
import com.bteam.ovs.voting.repository.VoteAllocCurrentRepository;
import com.bteam.ovs.voting.repository.VoteAllocItemRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AllocationVotingService {

    private static final int POINTS_TOTAL = 100;
    private static final String TYPE_CANDIDATE = "CANDIDATE";
    private static final String TYPE_NONE_SUPPORT = "NONE_SUPPORT";
    private static final String NONE_SUPPORT_LABEL = "今回は誰も支持しない";

    private final CitizenIdResolver citizenIdResolver;
    private final ElectionEligibilityService electionEligibilityService;
    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;

    private final VoteAllocCastRepository castRepo;
    private final VoteAllocItemRepository itemRepo;
    private final VoteAllocCurrentRepository voteAllocCurrentRepo;

    public AllocationVotingService(
            CitizenIdResolver citizenIdResolver,
            ElectionEligibilityService electionEligibilityService,
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            VoteAllocCastRepository castRepo,
            VoteAllocItemRepository itemRepo,
            VoteAllocCurrentRepository currentRepo) {
        this.citizenIdResolver = citizenIdResolver;
        this.electionEligibilityService = electionEligibilityService;
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
        this.castRepo = castRepo;
        this.itemRepo = itemRepo;
        this.voteAllocCurrentRepo = currentRepo;
    }

    public AllocVoteStartResponse start(UUID accountId, UUID electionId) {
        electionEligibilityService.requireEligible(accountId, electionId);
        citizenIdResolver.requireCitizenId(accountId);

        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        var options = new ArrayList<AllocVoteStartResponse.OptionItem>();

        // 候補
        candidateRepo.findByElectionId(electionId).forEach(c -> options.add(new AllocVoteStartResponse.OptionItem(
                TYPE_CANDIDATE, c.getId(), c.getName())));

        // 特別枠：誰も支持しない
        options.add(new AllocVoteStartResponse.OptionItem(TYPE_NONE_SUPPORT, null, NONE_SUPPORT_LABEL));

        return new AllocVoteStartResponse(election.getId(), election.getTitle(), POINTS_TOTAL, options);
    }

    @Transactional
    public AllocVoteHistoryItem confirm(UUID accountId, UUID electionId, AllocVoteConfirmRequest req) {
        electionEligibilityService.requireEligible(accountId, electionId);
        UUID citizenId = citizenIdResolver.requireCitizenId(accountId);

        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        var now = Instant.now();
        boolean withinPeriod = !now.isBefore(election.getStartsAt()) && now.isBefore(election.getEndsAt());
        if (!withinPeriod) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ELECTION_NOT_ONGOING", "投票可能期間外です");
        }

        if (req.pointsTotal() != POINTS_TOTAL) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_POINTS_TOTAL", "合計ポイントは100である必要があります");
        }

        if (req.items() == null || req.items().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ITEMS", "配分が空です");
        }

        int sum = 0;
        boolean hasNoneSupport = false;
        Set<UUID> seenCandidates = new HashSet<>();

        Set<UUID> candidateIds = req.items().stream()
                .filter(i -> "CANDIDATE".equals(i.type()))
                .map(AllocVoteConfirmRequest.Item::candidateId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // null混入はループ内で弾いてる前提でもOKだが、ここでも弾ける
        long ok = candidateIds.isEmpty()
                ? 0
                : candidateRepo.countByElectionIdAndIdIn(electionId, candidateIds);

        if (ok != candidateIds.size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE", "候補が不正です");
        }

        for (var item : req.items()) {
            if (item.points() == null || item.points() <= 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_POINTS", "ポイントは正の値である必要があります");
            }
            sum += item.points();

            String type = item.type();
            if (!TYPE_CANDIDATE.equals(type) && !TYPE_NONE_SUPPORT.equals(type)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TARGET_TYPE", "投票先の種類が不正です");
            }

            if (TYPE_CANDIDATE.equals(type)) {
                UUID candidateId = item.candidateId();
                if (!seenCandidates.add(candidateId)) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "DUPLICATE_CANDIDATE", "同一候補への重複配分はできません");
                }
            } else { // NONE_SUPPORT
                if (item.candidateId() != null) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_NONE_SUPPORT", "誰も支持しない票に候補IDは指定できません");
                }
                if (hasNoneSupport) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "DUPLICATE_NONE_SUPPORT", "誰も支持しない票は1つだけ指定できます");
                }
                hasNoneSupport = true;
            }
        }

        if (sum != POINTS_TOTAL) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "POINTS_SUM_MISMATCH", "ポイント合計が100ではありません");
        }

        // cast 保存
        var cast = new VoteAllocCast();
        cast.setElectionId(electionId);
        cast.setCitizenId(citizenId);
        cast.setPointsTotal(POINTS_TOTAL);
        cast.setCastedAt(now);
        castRepo.save(cast);

        // item 保存
        var items = new ArrayList<VoteAllocItem>(req.items().size());
        for (var r : req.items()) {
            var it = new VoteAllocItem();
            it.setCastId(cast.getId());
            it.setPoints(r.points());

            if (TYPE_CANDIDATE.equals(r.type())) {
                it.setTargetType(VoteAllocItem.TargetType.CANDIDATE);
                it.setCandidateId(r.candidateId());
            } else {
                it.setTargetType(VoteAllocItem.TargetType.NONE_SUPPORT);
                it.setCandidateId(null);
            }

            items.add(it);
        }
        itemRepo.saveAll(items);

        // current upsert
        var current = voteAllocCurrentRepo.findByElectionIdAndCitizenId(electionId, citizenId)
                .orElseGet(() -> {
                    var v = new VoteAllocCurrent();
                    v.setElectionId(electionId);
                    v.setCitizenId(citizenId);
                    return v;
                });

        current.setCastId(cast.getId());

        try {
            voteAllocCurrentRepo.save(current);
        } catch (DataIntegrityViolationException ex) {
            var retry = voteAllocCurrentRepo.findByElectionIdAndCitizenId(electionId, citizenId)
                    .orElseThrow(() -> ex);
            retry.setCastId(cast.getId());
            voteAllocCurrentRepo.save(retry);
        }

        // ラベル解決（候補名＋特別枠）
        Map<UUID, String> candName = candidateRepo.findByElectionId(electionId).stream()
                .collect(Collectors.toMap(c -> c.getId(), c -> c.getName()));

        var respItems = items.stream()
                .map(i -> new AllocVoteHistoryItem.AllocItem(
                        i.getTargetType().name(),
                        i.getCandidateId(),
                        i.getTargetType() == VoteAllocItem.TargetType.CANDIDATE
                                ? candName.getOrDefault(i.getCandidateId(), "(unknown candidate)")
                                : NONE_SUPPORT_LABEL,
                        i.getPoints()))
                .toList();

        return new AllocVoteHistoryItem(
                cast.getId(),
                election.getId(),
                election.getTitle(),
                resolveElectionStatus(now, election.getStartsAt(), election.getEndsAt()),
                POINTS_TOTAL,
                now,
                respItems);
    }

    public List<AllocVoteHistoryItem> history(UUID accountId) {
        UUID citizenId = citizenIdResolver.requireCitizenId(accountId);

        var casts = castRepo.findByCitizenIdOrderByCastedAtDesc(citizenId);
        if (casts.isEmpty())
            return List.of();

        var electionIds = casts.stream().map(VoteAllocCast::getElectionId).collect(Collectors.toSet());
        var elections = electionRepo.findAllById(electionIds).stream()
                .collect(Collectors.toMap(e -> e.getId(), Function.identity()));

        // items 一括取得（N+1回避）
        var castIds = casts.stream().map(VoteAllocCast::getId).collect(Collectors.toSet());
        var allItems = itemRepo.findByCastIdIn(castIds);

        Map<UUID, List<VoteAllocItem>> itemsByCastId = allItems.stream()
                .collect(Collectors.groupingBy(VoteAllocItem::getCastId));

        // 候補名マップ（一括）
        var allCandidateIds = allItems.stream()
                .filter(i -> i.getTargetType() == VoteAllocItem.TargetType.CANDIDATE)
                .map(VoteAllocItem::getCandidateId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, String> candidateNameById = allCandidateIds.isEmpty()
                ? Map.of()
                : candidateRepo.findAllById(allCandidateIds).stream()
                        .collect(Collectors.toMap(c -> c.getId(), c -> c.getName()));

        Instant now = Instant.now();

        return casts.stream().map(cast -> {
            var e = elections.get(cast.getElectionId());

            var items = itemsByCastId.getOrDefault(cast.getId(), List.of());

            String st = "UNKNOWN";
            String title = "(unknown election)";
            if (e != null) {
                st = resolveElectionStatus(now, e.getStartsAt(), e.getEndsAt());
                title = e.getTitle();
            }

            var respItems = items.stream()
                    .map(i -> new AllocVoteHistoryItem.AllocItem(
                            i.getTargetType().name(),
                            i.getCandidateId(),
                            i.getTargetType() == VoteAllocItem.TargetType.CANDIDATE
                                    ? candidateNameById.getOrDefault(i.getCandidateId(), "(unknown candidate)")
                                    : NONE_SUPPORT_LABEL,
                            i.getPoints()))
                    .toList();

            return new AllocVoteHistoryItem(
                    cast.getId(),
                    cast.getElectionId(),
                    title,
                    st,
                    cast.getPointsTotal() != null ? cast.getPointsTotal() : POINTS_TOTAL,
                    cast.getCastedAt(),
                    respItems);
        }).toList();
    }

    private String resolveElectionStatus(Instant now, Instant startsAt, Instant endsAt) {
        if (now.isBefore(startsAt))
            return "UPCOMING";
        if (!now.isBefore(endsAt))
            return "ENDED";
        return "ONGOING";
    }
}
