package com.bteam.ovs.elections.service;

import com.bteam.ovs.candidates.service.CandidateService;
import com.bteam.ovs.elections.controller.dto.AllocElectionResultResponse;
import com.bteam.ovs.elections.controller.dto.ElectionDetailResponse;
import com.bteam.ovs.elections.controller.dto.ElectionListItem;
import com.bteam.ovs.elections.controller.dto.ElectionResultBundleResponse;
import com.bteam.ovs.elections.controller.dto.ElectionResultResponse;
import com.bteam.ovs.elections.entity.BallotType;
import com.bteam.ovs.elections.entity.Election;
import com.bteam.ovs.elections.entity.ElectionStatus;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.parties.repository.PartyRepository;
import com.bteam.ovs.shared.auth.AccountResolver;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.voting.repository.VoteAllocItemRepository;
import com.bteam.ovs.voting.repository.VoteCurrentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ElectionService {

    private final ElectionRepository electionRepo;
    private final VoteCurrentRepository voteCurrentRepo;
    private final AccountResolver accountResolver;
    private final ElectionEligibilityService electionEligibilityService;
    private final CandidateService candidateService;
    private final VoteAllocItemRepository voteAllocItemRepo;
    private final PartyRepository partyRepo;

    public ElectionService(
            ElectionRepository electionRepo,
            VoteCurrentRepository voteCurrentRepo,
            AccountResolver accountResolver,
            ElectionEligibilityService electionEligibilityService,
            CandidateService candidateService,
            VoteAllocItemRepository voteAllocItemRepo,
            PartyRepository partyRepo) {
        this.electionRepo = electionRepo;
        this.voteCurrentRepo = voteCurrentRepo;
        this.accountResolver = accountResolver;
        this.electionEligibilityService = electionEligibilityService;
        this.candidateService = candidateService;
        this.voteAllocItemRepo = voteAllocItemRepo;
        this.partyRepo = partyRepo;
    }

    public List<ElectionListItem> list(UUID accountIdOrNull) {
        // final Instant now = Instant.now();

        var elections = electionRepo.findAllByOrderByStartsAtDesc();
        if (elections.isEmpty())
            return List.of();

        var electionIds = elections.stream().map(Election::getId).toList();

        // 候補者数
        Map<UUID, Long> candidateCountByElectionId = candidateService.countByElectionIds(electionIds);

        // currentVote の候補者名表示用
        Map<UUID, String> candidateNameById = candidateService.candidateNameMapByElectionIds(electionIds);

        // 公開API：accountIdが来ても「見つからない/無効/ロック」は未ログイン扱い
        UUID citizenId = null;
        boolean identityLinked = false;

        var accOpt = accountResolver.findActiveAccount(accountIdOrNull);
        if (accOpt.isPresent()) {
            citizenId = accOpt.get().getCitizenId();
            identityLinked = (citizenId != null);
        }

        Map<UUID, com.bteam.ovs.voting.entity.VoteCurrent> currentByElectionId = Map.of();
        if (identityLinked) {
            currentByElectionId = voteCurrentRepo.findByCitizenIdAndElectionIdIn(citizenId, electionIds).stream()
                    .collect(Collectors.toMap(
                            v -> v.getElectionId(),
                            Function.identity(),
                            (a, b) -> a));
        }

        final boolean finalIdentityLinked = identityLinked;
        final Map<UUID, com.bteam.ovs.voting.entity.VoteCurrent> finalCurrentByElectionId = currentByElectionId;

        return elections.stream()
                .map(e -> {
                    String st = status(e);
                    boolean hasResult = (e.getStatus() == ElectionStatus.PUBLISHED);

                    long cnt = candidateCountByElectionId.getOrDefault(e.getId(), 0L);
                    int candidateCount = (cnt > Integer.MAX_VALUE) ? Integer.MAX_VALUE : (int) cnt;

                    boolean canCast = finalIdentityLinked
                            && e.getStatus() == ElectionStatus.OPEN
                            && accountIdOrNull != null
                            && electionEligibilityService.isEligible(accountIdOrNull, e.getId());

                    ElectionListItem.CurrentVote currentVote = null;
                    if (finalIdentityLinked) {
                        var cur = finalCurrentByElectionId.get(e.getId());
                        if (cur != null) {
                            if ("NONE_SUPPORT".equals(cur.getType())) {
                                currentVote = new ElectionListItem.CurrentVote(
                                        null,
                                        "誰も支持しない",
                                        cur.getCastedAt());
                            } else {
                                var cid = cur.getCandidateId();
                                currentVote = new ElectionListItem.CurrentVote(
                                        cid,
                                        candidateNameById.get(cid),
                                        cur.getCastedAt());
                            }
                        }
                    }

                    return new ElectionListItem(
                            e.getId(),
                            e.getTitle(),
                            e.getStartsAt(),
                            e.getEndsAt(),
                            st,
                            hasResult,
                            candidateCount,
                            canCast,
                            currentVote,
                            e.getBallotType().name(),
                            currentVote != null);
                })
                .toList();
    }

    public ElectionDetailResponse detail(UUID electionId, UUID accountIdOrNull) {
        // final Instant now = Instant.now();

        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        String st = status(election);

        // 候補者（一覧＋candidateId->name）
        var bundle = candidateService.bundleByElection(electionId);
        var candidates = bundle.items();
        int candidateCount = candidates.size();
        Map<UUID, String> candidateNameById = bundle.candidateNameById();

        // 公開API：accountIdが来ても「見つからない/無効/ロック」は未ログイン扱い
        boolean identityLinked = false;
        UUID citizenId = null;

        var accOpt = accountResolver.findActiveAccount(accountIdOrNull);
        if (accOpt.isPresent()) {
            citizenId = accOpt.get().getCitizenId();
            identityLinked = (citizenId != null);
        }

        boolean canCast = identityLinked && election.getStatus() == ElectionStatus.OPEN;

        ElectionListItem.CurrentVote currentVote = null;
        if (identityLinked) {
            var curOpt = voteCurrentRepo.findByElectionIdAndCitizenId(electionId, citizenId);
            if (curOpt.isPresent()) {
                var cur = curOpt.get();

                if ("NONE_SUPPORT".equals(cur.getType())) {
                    currentVote = new ElectionListItem.CurrentVote(
                            null,
                            "誰も支持しない",
                            cur.getCastedAt());
                } else {
                    UUID cid = cur.getCandidateId();
                    currentVote = new ElectionListItem.CurrentVote(
                            cid,
                            candidateNameById.get(cid),
                            cur.getCastedAt());
                }
            }
        }

        return new ElectionDetailResponse(
                election.getId(),
                election.getTitle(),
                election.getStartsAt(),
                election.getEndsAt(),
                st,
                candidateCount,
                candidates,
                canCast,
                currentVote);
    }

    public ElectionResultResponse result(UUID electionId) {
        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        // ★ 公開判定：PUBLISHED のみ
        if (election.getStatus() != ElectionStatus.PUBLISHED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "RESULT_NOT_AVAILABLE", "結果は選挙管理委員会の公開後に閲覧できます");
        }

        var candidates = candidateService.summariesByElection(electionId);
        var rows = voteCurrentRepo.countByElectionGroupByTypeAndCandidate(electionId);

        Map<UUID, Long> countMap = new HashMap<>();
        long noneSupportVotes = 0L;

        for (var r : rows) {
            if ("NONE_SUPPORT".equals(r.getType())) {
                noneSupportVotes += r.getCnt();
                continue;
            }
            UUID cid = r.getCandidateId();
            if (cid == null) {
                noneSupportVotes += r.getCnt();
                continue;
            }
            countMap.put(cid, r.getCnt());
        }

        long totalVotes = countMap.values().stream().mapToLong(Long::longValue).sum() + noneSupportVotes;

        var results = candidates.stream()
                .map(c -> {
                    UUID candidateId = c.candidateId();
                    String candidateKey = c.candidateKey();
                    String candidateName = c.name();
                    long votes = countMap.getOrDefault(candidateId, 0L);

                    return new ElectionResultResponse.CandidateResult(
                            candidateId,
                            candidateKey,
                            candidateName,
                            votes);
                })
                .sorted((a, b) -> Long.compare(b.votes(), a.votes()))
                .toList();

        // 既存のDTO仕様に合わせて talliedAt は now を維持（厳密にしたいなら election.getTalliedAt() へ）
        Instant talliedAt = (election.getTalliedAt() != null) ? election.getTalliedAt() : Instant.now();

        return new ElectionResultResponse(
                election.getId(),
                election.getTitle(),
                "CURRENT",
                totalVotes,
                talliedAt,
                results);
    }

    // 旧：時刻判定。マイグレーション中の保険用に残す
    public static String status(Instant now, Instant startsAt, Instant endsAt) {
        if (now.isBefore(startsAt))
            return "UPCOMING";
        if (!now.isBefore(endsAt))
            return "ENDED";
        return "ONGOING";
    }

    public static String status(Election e) {
        return status(Instant.now(), e.getStartsAt(), e.getEndsAt());
    }

    public ElectionResultBundleResponse resultBundle(UUID electionId) {
        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        // ★ 公開判定：PUBLISHED のみ
        if (election.getStatus() != ElectionStatus.PUBLISHED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "RESULT_NOT_AVAILABLE", "結果は選挙管理委員会の公開後に閲覧できます");
        }

        if (election.getBallotType() == BallotType.ALLOCATION) {
            return new ElectionResultBundleResponse(
                    election.getId(),
                    election.getBallotType().name(),
                    null,
                    allocResult(electionId));
        }

        return new ElectionResultBundleResponse(
                election.getId(),
                election.getBallotType().name(),
                result(electionId),
                null);
    }

    // ★ 追加：CommitteeElectionService が呼ぶ
    public ElectionDetailResponse toDetailResponse(Election election) {
        String st = status(election);

        var bundle = candidateService.bundleByElection(election.getId());
        var candidates = bundle.items();
        int candidateCount = candidates.size();

        // committee用途：投票可否/現在票は不要（false/null）
        return new ElectionDetailResponse(
                election.getId(),
                election.getTitle(),
                election.getStartsAt(),
                election.getEndsAt(),
                st,
                candidateCount,
                candidates,
                false,
                null);
    }

    private boolean isPartyAllocationElection(Election election) {
        String label = election.getDistrictLabel();
        if (label == null)
            return false;
        return label.contains("比例") || label.contains("ブロック") || label.contains("PR");
    }

    public AllocElectionResultResponse allocResult(UUID electionId) {
        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        // ★ 公開判定：PUBLISHED のみ
        if (election.getStatus() != ElectionStatus.PUBLISHED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "RESULT_NOT_AVAILABLE", "結果は選挙管理委員会の公開後に閲覧できます");
        }

        boolean partyAlloc = isPartyAllocationElection(election);

        long noneSupportPoints = voteAllocItemRepo.sumNoneSupportPointsByElection(electionId);

        Instant talliedAt = (election.getTalliedAt() != null) ? election.getTalliedAt() : Instant.now();

        // =========================
        // PARTY 配分（比例など）
        // =========================
        if (partyAlloc) {
            var parties = partyRepo.findAll();

            Map<UUID, Long> pointMap = voteAllocItemRepo.sumPointsByElectionGroupByParty(electionId).stream()
                    .collect(Collectors.toMap(
                            VoteAllocItemRepository.PartyPointSum::getPartyId,
                            v -> v.getPts() != null ? v.getPts() : 0L));

            long totalPoints = pointMap.values().stream().mapToLong(Long::longValue).sum() + noneSupportPoints;

            // DTO を流用（candidateId枠にpartyIdを詰めるMVP）
            var results = parties.stream()
                    .map(p -> new AllocElectionResultResponse.CandidatePointResult(
                            p.getId(),
                            p.getPartyKey(), // candidateKey枠にpartyKey
                            p.getName(), // candidateName枠にparty名
                            pointMap.getOrDefault(p.getId(), 0L)))
                    .sorted((a, b) -> Long.compare(b.points(), a.points()))
                    .toList();

            return new AllocElectionResultResponse(
                    election.getId(),
                    election.getTitle(),
                    "CURRENT",
                    totalPoints,
                    noneSupportPoints,
                    talliedAt,
                    results);
        }

        // =========================
        // CANDIDATE 配分（既存）
        // =========================
        var candidates = candidateService.summariesByElection(electionId);

        Map<UUID, Long> pointMap = voteAllocItemRepo.sumPointsByElectionGroupByCandidate(electionId).stream()
                .collect(Collectors.toMap(
                        VoteAllocItemRepository.PointSum::getCandidateId,
                        v -> v.getPts() != null ? v.getPts() : 0L));

        long totalPoints = pointMap.values().stream().mapToLong(Long::longValue).sum() + noneSupportPoints;

        var results = candidates.stream()
                .map(c -> {
                    UUID candidateId = c.candidateId();
                    String candidateKey = c.candidateKey();
                    String name = c.name();
                    long points = pointMap.getOrDefault(candidateId, 0L);

                    return new AllocElectionResultResponse.CandidatePointResult(
                            candidateId,
                            candidateKey,
                            name,
                            points);
                })
                .sorted((a, b) -> Long.compare(b.points(), a.points()))
                .toList();

        return new AllocElectionResultResponse(
                election.getId(),
                election.getTitle(),
                "CURRENT",
                totalPoints,
                noneSupportPoints,
                talliedAt,
                results);
    }

}