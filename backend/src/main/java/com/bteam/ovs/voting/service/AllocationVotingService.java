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
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        var options = new ArrayList<AllocVoteStartResponse.OptionItem>();

        // 候補
        candidateRepo.findByElectionId(electionId).forEach(c -> options.add(new AllocVoteStartResponse.OptionItem(
                "CANDIDATE", c.getId(), c.getName())));

        // 特別枠：誰も支持しない
        options.add(new AllocVoteStartResponse.OptionItem(
                "NONE_SUPPORT", null, "今回は誰も支持しない"));

        return new AllocVoteStartResponse(election.getId(), election.getTitle(), 100, options);
    }

    @Transactional
    public AllocVoteHistoryItem confirm(UUID accountId, UUID electionId, AllocVoteConfirmRequest req) {
        electionEligibilityService.requireEligible(accountId, electionId);
        UUID citizenId = citizenIdResolver.requireCitizenId(accountId);

        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        var now = Instant.now();
        boolean withinPeriod = !now.isBefore(election.getStartsAt()) && now.isBefore(election.getEndsAt());
        if (!withinPeriod) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ELECTION_NOT_ONGOING", "投票可能期間外です");
        }

        int pointsTotal = (req.pointsTotal() != null) ? req.pointsTotal() : 100;
        if (pointsTotal != 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_POINTS_TOTAL", "合計ポイントは100である必要があります");
        }

        // items 検証
        if (req.items() == null || req.items().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ITEMS", "配分が空です");
        }

        int sum = 0;

        // candidateId 重複禁止（CANDIDATEのみ）
        Set<UUID> seenCandidates = new HashSet<>();

        // 候補が選挙に属しているかのチェック用に Set 化
        Set<UUID> validCandidateIds = candidateRepo.findByElectionId(electionId).stream()
                .map(c -> c.getId())
                .collect(Collectors.toSet());

        boolean hasNoneSupport = false;

        for (var item : req.items()) {
            if (item.points() == null || item.points() <= 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_POINTS", "ポイントは正の値である必要があります");
            }
            sum += item.points();

            String type = item.type();
            if (!"CANDIDATE".equals(type) && !"NONE_SUPPORT".equals(type)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TARGET_TYPE", "投票先の種類が不正です");
            }

            if ("CANDIDATE".equals(type)) {
                if (item.candidateId() == null) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE", "候補が不正です");
                }
                if (!validCandidateIds.contains(item.candidateId())) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE", "候補が不正です");
                }
                if (!seenCandidates.add(item.candidateId())) {
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

        if (sum != 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "POINTS_SUM_MISMATCH", "ポイント合計が100ではありません");
        }

        // cast 保存
        var cast = new VoteAllocCast();
        cast.setElectionId(electionId);
        cast.setCitizenId(citizenId);
        cast.setPointsTotal(100);
        cast.setCastedAt(now);
        castRepo.save(cast);

        // item 保存
        var items = new ArrayList<VoteAllocItem>();
        for (var r : req.items()) {
            var it = new VoteAllocItem();
            it.setCastId(cast.getId());
            it.setPoints(r.points());
            if ("CANDIDATE".equals(r.type())) {
                it.setTargetType(VoteAllocItem.TargetType.CANDIDATE);
                it.setCandidateId(r.candidateId());
            } else {
                it.setTargetType(VoteAllocItem.TargetType.NONE_SUPPORT);
                it.setCandidateId(null);
            }
            items.add(it);
        }
        itemRepo.saveAll(items);

        var current = voteAllocCurrentRepo.findByElectionIdAndCitizenId(electionId, citizenId)
                .orElseGet(() -> {
                    var v = new VoteAllocCurrent();
                    v.setElectionId(electionId);
                    v.setCitizenId(citizenId);
                    return v;
                });

        current.setCastId(cast.getId());
        // castedAt は @PreUpdate で上書きされる設計なので、明示セット不要でもOK
        // current.setCastedAt(now);

        try {
            voteAllocCurrentRepo.save(current);
        } catch (DataIntegrityViolationException ex) {
            // VoteCurrent と同じ “念のためリトライ”
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
                                : "今回は誰も支持しない",
                        i.getPoints()))
                .toList();

        return new AllocVoteHistoryItem(
                cast.getId(),
                election.getId(),
                election.getTitle(),
                resolveElectionStatus(now, election.getStartsAt(), election.getEndsAt()),
                100,
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

        // items を castId ごとにまとめて取る（雑に N+1 になるの嫌なら query を足す）
        // まずは簡単に：cast単位で findByCastId
        return casts.stream().map(cast -> {
            var e = elections.get(cast.getElectionId());

            var items = itemRepo.findByCastId(cast.getId());

            // candidateId -> name（この cast 内に含まれる分だけ取る）
            var candidateIds = items.stream()
                    .filter(i -> i.getTargetType() == VoteAllocItem.TargetType.CANDIDATE)
                    .map(VoteAllocItem::getCandidateId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            Map<UUID, String> candName = candidateIds.isEmpty() ? Map.of()
                    : candidateRepo.findAllById(candidateIds).stream()
                            .collect(Collectors.toMap(ca -> ca.getId(), ca -> ca.getName()));

            String status = "UNKNOWN";
            if (e != null) {
                status = resolveElectionStatus(Instant.now(), e.getStartsAt(), e.getEndsAt());
            }

            var respItems = items.stream()
                    .map(i -> new AllocVoteHistoryItem.AllocItem(
                            i.getTargetType().name(),
                            i.getCandidateId(),
                            i.getTargetType() == VoteAllocItem.TargetType.CANDIDATE
                                    ? candName.getOrDefault(i.getCandidateId(), "(unknown candidate)")
                                    : "今回は誰も支持しない",
                            i.getPoints()))
                    .toList();

            return new AllocVoteHistoryItem(
                    cast.getId(),
                    cast.getElectionId(),
                    e != null ? e.getTitle() : "(unknown election)",
                    status,
                    cast.getPointsTotal() != null ? cast.getPointsTotal() : 100,
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
