package com.bteam.ovs.voting.service;

import com.bteam.ovs.candidates.repository.CandidateRepository;
import com.bteam.ovs.elections.entity.Election;
import com.bteam.ovs.elections.entity.ElectionStatus;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.elections.service.ElectionEligibilityService;
import com.bteam.ovs.parties.repository.PartyRepository;
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
import com.bteam.ovs.shared.validation.UuidParsers;
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
    private static final String TYPE_PARTY = "PARTY";
    private static final String TYPE_NONE_SUPPORT = "NONE_SUPPORT";
    private static final String NONE_SUPPORT_LABEL = "今回は誰も支持しない";

    private final CitizenIdResolver citizenIdResolver;
    private final ElectionEligibilityService electionEligibilityService;
    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;
    private final PartyRepository partyRepo;

    private final VoteAllocCastRepository castRepo;
    private final VoteAllocItemRepository itemRepo;
    private final VoteAllocCurrentRepository voteAllocCurrentRepo;

    public AllocationVotingService(
            CitizenIdResolver citizenIdResolver,
            ElectionEligibilityService electionEligibilityService,
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            PartyRepository partyRepo,
            VoteAllocCastRepository castRepo,
            VoteAllocItemRepository itemRepo,
            VoteAllocCurrentRepository currentRepo) {
        this.citizenIdResolver = citizenIdResolver;
        this.electionEligibilityService = electionEligibilityService;
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
        this.partyRepo = partyRepo;
        this.castRepo = castRepo;
        this.itemRepo = itemRepo;
        this.voteAllocCurrentRepo = currentRepo;
    }

    // =========================================
    // Login (accountId) -> citizenId -> delegate
    // =========================================
    public AllocVoteStartResponse start(UUID accountId, UUID electionId) {
        electionEligibilityService.requireEligible(accountId, electionId);
        UUID citizenId = citizenIdResolver.requireCitizenId(accountId);
        return startByCitizen(citizenId, electionId);
    }

    @Transactional
    public AllocVoteHistoryItem confirm(UUID accountId, UUID electionId, AllocVoteConfirmRequest req) {
        electionEligibilityService.requireEligible(accountId, electionId);
        UUID citizenId = citizenIdResolver.requireCitizenId(accountId);
        return confirmByCitizen(citizenId, electionId, req);
    }

    // =========================================
    // Public (vote token) entry points
    // =========================================
    public AllocVoteStartResponse startByCitizen(UUID citizenId, UUID electionId) {
        electionEligibilityService.requireEligibleCitizen(citizenId, electionId);

        Election election = requireElection(electionId);
        requireOpenAndWithinPeriod(election, Instant.now());

        boolean isPartyAllocation = isPartyAllocationElection(election);

        var options = new ArrayList<AllocVoteStartResponse.OptionItem>();

        if (isPartyAllocation) {
            partyRepo.findAll().forEach(
                    p -> options.add(new AllocVoteStartResponse.OptionItem(TYPE_PARTY, p.getId(), p.getName())));
        } else {
            candidateRepo.findByElectionId(electionId).forEach(
                    c -> options.add(new AllocVoteStartResponse.OptionItem(TYPE_CANDIDATE, c.getId(), c.getName())));
        }

        options.add(new AllocVoteStartResponse.OptionItem(TYPE_NONE_SUPPORT, null, NONE_SUPPORT_LABEL));

        return new AllocVoteStartResponse(election.getId(), election.getTitle(), POINTS_TOTAL, options);
    }

    @Transactional
    public AllocVoteHistoryItem confirmByCitizen(UUID citizenId, UUID electionId, AllocVoteConfirmRequest req) {
        electionEligibilityService.requireEligibleCitizen(citizenId, electionId);

        Election election = requireElection(electionId);
        Instant now = Instant.now();
        requireOpenAndWithinPeriod(election, now);

        boolean isPartyAllocation = isPartyAllocationElection(election);

        if (req.pointsTotal() == null || req.pointsTotal() != POINTS_TOTAL) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_POINTS_TOTAL", "合計ポイントは100である必要があります");
        }
        if (req.items() == null || req.items().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ITEMS", "配分が空です");
        }

        int sum = 0;
        boolean hasNoneSupport = false;
        Set<UUID> seenTargets = new HashSet<>();

        // 対象ID収集（検証用）
        Set<UUID> targetIds = req.items().stream()
                .filter(i -> i != null && (TYPE_PARTY.equals(i.type()) || TYPE_CANDIDATE.equals(i.type())))
                .map(AllocVoteConfirmRequest.Item::targetId)
                .filter(Objects::nonNull)
                .map(s -> UuidParsers.parseOr400(s, "INVALID_TARGET_ID", "targetIdが不正です"))
                .collect(Collectors.toSet());

        // type 検証（選挙に応じて許可）
        for (var item : req.items()) {
            if (item == null)
                continue;

            if (item.points() == null || item.points() <= 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_POINTS", "ポイントは正の値である必要があります");
            }
            sum += item.points();

            String type = item.type();
            if (TYPE_NONE_SUPPORT.equals(type)) {
                if (item.targetId() != null && !item.targetId().isBlank()) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_NONE_SUPPORT", "誰も支持しない票にIDは指定できません");
                }
                if (hasNoneSupport) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "DUPLICATE_NONE_SUPPORT", "誰も支持しない票は1つだけ指定できます");
                }
                hasNoneSupport = true;
                continue;
            }

            if (isPartyAllocation) {
                if (!TYPE_PARTY.equals(type)) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TARGET_TYPE", "この選挙では政党に配分してください");
                }
            } else {
                if (!TYPE_CANDIDATE.equals(type)) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TARGET_TYPE", "この選挙では候補者に配分してください");
                }
            }

            if (item.targetId() == null || item.targetId().isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TARGET_ID", "targetIdが不正です");
            }

            UUID tid = UuidParsers.parseOr400(item.targetId(), "INVALID_TARGET_ID", "targetIdが不正です");
            if (!seenTargets.add(tid)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "DUPLICATE_TARGET", "同一対象への重複配分はできません");
            }
        }

        if (sum != POINTS_TOTAL) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "POINTS_SUM_MISMATCH", "ポイント合計が100ではありません");
        }

        // 対象存在チェック
        if (!targetIds.isEmpty()) {
            long ok = isPartyAllocation
                    ? partyRepo.countByIdIn(targetIds)
                    : candidateRepo.countByElectionIdAndIdIn(electionId, targetIds);

            if (ok != targetIds.size()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TARGET",
                        isPartyAllocation ? "政党が不正です" : "候補が不正です");
            }
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
            if (r == null)
                continue;

            var it = new VoteAllocItem();
            it.setCastId(cast.getId());
            it.setPoints(r.points());

            if (TYPE_NONE_SUPPORT.equals(r.type())) {
                it.setTargetType(VoteAllocItem.TargetType.NONE_SUPPORT);
                it.setCandidateId(null);
                it.setPartyId(null);
            } else if (isPartyAllocation) {
                it.setTargetType(VoteAllocItem.TargetType.PARTY);
                it.setPartyId(UuidParsers.parseOr400(r.targetId(), "INVALID_TARGET_ID", "targetIdが不正です"));
                it.setCandidateId(null);
            } else {
                it.setTargetType(VoteAllocItem.TargetType.CANDIDATE);
                it.setCandidateId(UuidParsers.parseOr400(r.targetId(), "INVALID_TARGET_ID", "targetIdが不正です"));
                it.setPartyId(null);
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

        // ラベル解決
        Map<UUID, String> labelById = resolveLabelMapForElection(electionId, isPartyAllocation);

        var respItems = items.stream()
                .map(i -> new AllocVoteHistoryItem.AllocItem(
                        i.getTargetType().name(),
                        i.getTargetType() == VoteAllocItem.TargetType.CANDIDATE ? i.getCandidateId()
                                : i.getTargetType() == VoteAllocItem.TargetType.PARTY ? i.getPartyId()
                                        : null,
                        i.getTargetType() == VoteAllocItem.TargetType.CANDIDATE
                                ? labelById.getOrDefault(i.getCandidateId(), "(unknown candidate)")
                                : i.getTargetType() == VoteAllocItem.TargetType.PARTY
                                        ? labelById.getOrDefault(i.getPartyId(), "(unknown party)")
                                        : NONE_SUPPORT_LABEL,
                        i.getPoints()))
                .toList();

        return new AllocVoteHistoryItem(
                cast.getId(),
                election.getId(),
                election.getTitle(),
                resolveElectionStatus(election),
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
                .collect(Collectors.toMap(Election::getId, Function.identity()));

        var castIds = casts.stream().map(VoteAllocCast::getId).collect(Collectors.toSet());
        var allItems = itemRepo.findByCastIdIn(castIds);
        Map<UUID, List<VoteAllocItem>> itemsByCastId = allItems.stream()
                .collect(Collectors.groupingBy(VoteAllocItem::getCastId));

        // 候補/政党のラベルを一括解決
        Set<UUID> allCandidateIds = allItems.stream()
                .filter(i -> i.getTargetType() == VoteAllocItem.TargetType.CANDIDATE)
                .map(VoteAllocItem::getCandidateId).filter(Objects::nonNull).collect(Collectors.toSet());

        Set<UUID> allPartyIds = allItems.stream()
                .filter(i -> i.getTargetType() == VoteAllocItem.TargetType.PARTY)
                .map(VoteAllocItem::getPartyId).filter(Objects::nonNull).collect(Collectors.toSet());

        Map<UUID, String> candidateNameById = allCandidateIds.isEmpty()
                ? Map.of()
                : candidateRepo.findAllById(allCandidateIds).stream()
                        .collect(Collectors.toMap(c -> c.getId(), c -> c.getName()));

        Map<UUID, String> partyNameById = allPartyIds.isEmpty()
                ? Map.of()
                : partyRepo.findAllById(allPartyIds).stream()
                        .collect(Collectors.toMap(p -> p.getId(), p -> p.getName()));

        return casts.stream().map(cast -> {
            var e = elections.get(cast.getElectionId());

            var items = itemsByCastId.getOrDefault(cast.getId(), List.of());

            String st = "UNKNOWN";
            String title = "(unknown election)";
            if (e != null) {
                st = resolveElectionStatus(e);
                title = e.getTitle();
            }

            var respItems = items.stream()
                    .map(i -> new AllocVoteHistoryItem.AllocItem(
                            i.getTargetType().name(),
                            i.getTargetType() == VoteAllocItem.TargetType.CANDIDATE ? i.getCandidateId()
                                    : i.getTargetType() == VoteAllocItem.TargetType.PARTY ? i.getPartyId()
                                            : null,
                            i.getTargetType() == VoteAllocItem.TargetType.CANDIDATE
                                    ? candidateNameById.getOrDefault(i.getCandidateId(), "(unknown candidate)")
                                    : i.getTargetType() == VoteAllocItem.TargetType.PARTY
                                            ? partyNameById.getOrDefault(i.getPartyId(), "(unknown party)")
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

    // ===== helpers =====

    private boolean isPartyAllocationElection(Election election) {
        String label = election.getDistrictLabel();
        if (label == null)
            return false;
        // MVP判定：テストデータ運用で「比例」「東京ブロック」を含めたら PARTY にする
        return label.contains("比例") || label.contains("ブロック") || label.contains("PR");
    }

    private Map<UUID, String> resolveLabelMapForElection(UUID electionId, boolean party) {
        if (party) {
            return partyRepo.findAll().stream().collect(Collectors.toMap(p -> p.getId(), p -> p.getName()));
        }
        return candidateRepo.findByElectionId(electionId).stream()
                .collect(Collectors.toMap(c -> c.getId(), c -> c.getName()));
    }

    private Election requireElection(UUID electionId) {
        return electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));
    }

    private void requireOpenAndWithinPeriod(Election election, Instant now) {
        if (election.getStatus() != ElectionStatus.OPEN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ELECTION_NOT_OPEN", "現在この選挙は投票できません");
        }
        boolean withinPeriod = !now.isBefore(election.getStartsAt()) && now.isBefore(election.getEndsAt());
        if (!withinPeriod) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ELECTION_NOT_ONGOING", "投票可能期間外です");
        }
    }

    private String resolveElectionStatus(Election election) {
        ElectionStatus s = election.getStatus();
        if (s == null)
            return "UNKNOWN";
        return switch (s) {
            case DRAFT, READY -> "UPCOMING";
            case OPEN -> "ONGOING";
            case CLOSED, TALLYING, TALLIED, PUBLISHED, ARCHIVED -> "ENDED"; // ★TALLYING追加
        };
    }

    @Transactional
    public void tally(UUID electionId) {
        // no-op
    }

}
