package com.bteam.ovs.elections.service;

import com.bteam.ovs.candidates.service.CandidateService;
import com.bteam.ovs.elections.controller.dto.AllocElectionResultResponse;
import com.bteam.ovs.elections.controller.dto.ElectionDetailResponse;
import com.bteam.ovs.elections.controller.dto.ElectionListItem;
import com.bteam.ovs.elections.controller.dto.ElectionResultBundleResponse;
import com.bteam.ovs.elections.controller.dto.ElectionResultResponse;
import com.bteam.ovs.elections.entity.BallotType;
import com.bteam.ovs.elections.repository.ElectionRepository;
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

    public ElectionService(
            ElectionRepository electionRepo,
            VoteCurrentRepository voteCurrentRepo,
            AccountResolver accountResolver,
            ElectionEligibilityService electionEligibilityService,
            CandidateService candidateService,
            VoteAllocItemRepository voteAllocItemRepo) {
        this.electionRepo = electionRepo;
        this.voteCurrentRepo = voteCurrentRepo;
        this.accountResolver = accountResolver;
        this.electionEligibilityService = electionEligibilityService;
        this.candidateService = candidateService;
        this.voteAllocItemRepo = voteAllocItemRepo;
    }

    public List<ElectionListItem> list(UUID accountIdOrNull) {
        final Instant now = Instant.now();

        var elections = electionRepo.findAllByOrderByStartsAtDesc();
        if (elections.isEmpty())
            return List.of();

        var electionIds = elections.stream().map(e -> e.getId()).toList();

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
                    String st = status(now, e.getStartsAt(), e.getEndsAt());
                    boolean hasResult = "ENDED".equals(st);

                    long cnt = candidateCountByElectionId.getOrDefault(e.getId(), 0L);
                    int candidateCount = (cnt > Integer.MAX_VALUE) ? Integer.MAX_VALUE : (int) cnt;

                    boolean canCast = finalIdentityLinked
                            && "ONGOING".equals(st)
                            && accountIdOrNull != null
                            && electionEligibilityService.isEligible(accountIdOrNull, e.getId());

                    ElectionListItem.CurrentVote currentVote = null;
                    if (finalIdentityLinked) {
                        var cur = finalCurrentByElectionId.get(e.getId());
                        if (cur != null) {
                            var cid = cur.getCandidateId();
                            currentVote = new ElectionListItem.CurrentVote(
                                    cid,
                                    candidateNameById.get(cid),
                                    cur.getCastedAt());
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
                            e.getBallotType().name());
                })
                .toList();
    }

    public ElectionDetailResponse detail(UUID electionId, UUID accountIdOrNull) {
        final Instant now = Instant.now();

        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        String st = status(now, election.getStartsAt(), election.getEndsAt());

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

        boolean canCast = identityLinked && "ONGOING".equals(st);

        // 現在投票（単発取得）
        ElectionListItem.CurrentVote currentVote = null;
        if (identityLinked) {
            var curOpt = voteCurrentRepo.findByElectionIdAndCitizenId(electionId, citizenId);
            if (curOpt.isPresent()) {
                var cur = curOpt.get();
                UUID cid = cur.getCandidateId();
                currentVote = new ElectionListItem.CurrentVote(
                        cid,
                        candidateNameById.get(cid),
                        cur.getCastedAt());
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

        var now = Instant.now();
        if (now.isBefore(election.getEndsAt())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "RESULT_NOT_AVAILABLE", "結果は選挙終了後に公開されます");
        }

        var candidates = candidateService.summariesByElection(electionId);

        var countMap = voteCurrentRepo.countByElectionGroupByCandidate(electionId).stream()
                .collect(Collectors.toMap(
                        VoteCurrentRepository.VoteCount::getCandidateId,
                        VoteCurrentRepository.VoteCount::getCnt));

        long totalVotes = countMap.values().stream().mapToLong(Long::longValue).sum();

        var results = candidates.stream()
                .map(c -> new ElectionResultResponse.CandidateResult(
                        c.candidateId(),
                        c.name(),
                        countMap.getOrDefault(c.candidateId(), 0L)))
                .sorted((a, b) -> Long.compare(b.votes(), a.votes()))
                .toList();

        return new ElectionResultResponse(
                election.getId(),
                election.getTitle(),
                "CURRENT",
                totalVotes,
                now,
                results);
    }

    public static String status(Instant now, Instant startsAt, Instant endsAt) {
        if (now.isBefore(startsAt))
            return "UPCOMING";
        if (!now.isBefore(endsAt))
            return "ENDED";
        return "ONGOING";
    }

    public AllocElectionResultResponse allocResult(UUID electionId) {
        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        var now = Instant.now();
        if (now.isBefore(election.getEndsAt())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "RESULT_NOT_AVAILABLE", "結果は選挙終了後に公開されます");
        }

        var candidates = candidateService.summariesByElection(electionId);

        var pointMap = voteAllocItemRepo.sumPointsByElectionGroupByCandidate(electionId).stream()
                .collect(Collectors.toMap(
                        VoteAllocItemRepository.PointSum::getCandidateId,
                        v -> v.getPts() != null ? v.getPts() : 0L));

        long noneSupportPoints = voteAllocItemRepo.sumNoneSupportPointsByElection(electionId);

        long totalPoints = pointMap.values().stream().mapToLong(Long::longValue).sum() + noneSupportPoints;

        var results = candidates.stream()
                .map(c -> new AllocElectionResultResponse.CandidatePointResult(
                        c.candidateId(),
                        c.name(),
                        pointMap.getOrDefault(c.candidateId(), 0L)))
                .sorted((a, b) -> Long.compare(b.points(), a.points()))
                .toList();

        return new AllocElectionResultResponse(
                election.getId(),
                election.getTitle(),
                "CURRENT",
                totalPoints,
                noneSupportPoints,
                now,
                results);
    }

    public ElectionResultBundleResponse resultBundle(UUID electionId) {
        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        var now = Instant.now();
        if (now.isBefore(election.getEndsAt())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "RESULT_NOT_AVAILABLE", "結果は選挙終了後に公開されます");
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

}
