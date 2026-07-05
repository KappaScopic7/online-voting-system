package com.bteam.ovs.elections.service;

import com.bteam.ovs.candidates.service.CandidateService;
import com.bteam.ovs.elections.dto.response.AllocElectionResultResponse;
import com.bteam.ovs.elections.dto.response.ElectionDetailResponse;
import com.bteam.ovs.elections.dto.response.ElectionListItem;
import com.bteam.ovs.elections.dto.response.ElectionResultBundleResponse;
import com.bteam.ovs.elections.dto.response.ElectionResultResponse;
import com.bteam.ovs.elections.entity.BallotType;
import com.bteam.ovs.elections.entity.Election;
import com.bteam.ovs.elections.entity.ElectionStatus;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.parties.repository.PartyRepository;
import com.bteam.ovs.shared.auth.AccountResolver;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.voting.entity.VoteAllocCast;
import com.bteam.ovs.voting.repository.VoteAllocCastRepository;
import com.bteam.ovs.voting.repository.VoteAllocItemRepository;
import com.bteam.ovs.voting.repository.VoteCurrentRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import com.bteam.ovs.voting.repository.JudgeReviewCastRepository;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class ElectionService {

    private final ElectionRepository electionRepo;
    private final VoteCurrentRepository voteCurrentRepo;
    private final AccountResolver accountResolver;
    private final ElectionEligibilityService electionEligibilityService;
    private final CandidateService candidateService;
    private final VoteAllocItemRepository voteAllocItemRepo;
    private final PartyRepository partyRepo;
    private final VoteAllocCastRepository voteAllocCastRepo;
    private final JudgeReviewCastRepository judgeReviewCastRepo;

    public List<ElectionListItem> list(UUID accountIdOrNull) {
        var elections = electionRepo.findAllByOrderByStartsAtDesc();
        if (elections.isEmpty())
            return List.of();

        var electionIds = elections.stream().map(Election::getId).toList();

        Map<UUID, Long> candidateCountByElectionId = candidateService.countByElectionIds(electionIds);

        Map<UUID, String> candidateNameById = candidateService.candidateNameMapByElectionIds(electionIds);

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

        Set<UUID> allocCurrentElectionIds = Set.of();
        if (identityLinked) {
            allocCurrentElectionIds = voteAllocCastRepo.findByCitizenIdAndElectionIdIn(citizenId, electionIds).stream()
                    .map(VoteAllocCast::getElectionId)
                    .collect(Collectors.toSet());
        }

        Set<UUID> jrCurrentElectionIds = Set.of();
        if (identityLinked) {
            jrCurrentElectionIds = judgeReviewCastRepo
                    .findByCitizenIdAndElectionIdIn(citizenId, electionIds).stream()
                    .map(c -> c.getElectionId())
                    .collect(Collectors.toSet());
        }

        final boolean finalIdentityLinked = identityLinked;
        final UUID finalAccountIdOrNull = accountIdOrNull;
        final Map<UUID, com.bteam.ovs.voting.entity.VoteCurrent> finalCurrentByElectionId = currentByElectionId;
        final Set<UUID> finalAllocCurrentElectionIds = allocCurrentElectionIds;
        final Set<UUID> finalJrCurrentElectionIds = jrCurrentElectionIds;

        return elections.stream()
                .map(e -> {
                    String st = status(e);
                    boolean hasResult = (e.getStatus() == ElectionStatus.PUBLISHED);

                    long cnt = candidateCountByElectionId.getOrDefault(e.getId(), 0L);
                    int candidateCount = (cnt > Integer.MAX_VALUE) ? Integer.MAX_VALUE : (int) cnt;

                    boolean canCast = finalIdentityLinked
                            && e.getStatus() == ElectionStatus.OPEN
                            && finalAccountIdOrNull != null
                            && electionEligibilityService.isEligible(finalAccountIdOrNull, e.getId());

                    ElectionListItem.CurrentVote currentVote = null;
                    if (finalIdentityLinked && e.getBallotType() == BallotType.SINGLE_CHOICE) {
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

                    boolean hasCurrent = false;
                    if (finalIdentityLinked) {
                        if (e.getBallotType() == BallotType.SINGLE_CHOICE) {
                            hasCurrent = (currentVote != null);
                        } else if (e.getBallotType() == BallotType.ALLOCATION) {
                            hasCurrent = finalAllocCurrentElectionIds.contains(e.getId());
                        } else if (e.getBallotType() == BallotType.JUDGE_REVIEW) {
                            hasCurrent = finalJrCurrentElectionIds.contains(e.getId());
                        } else {
                            hasCurrent = false;
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
                            hasCurrent);
                })
                .toList();
    }

    public ElectionDetailResponse detail(UUID electionId, UUID accountIdOrNull) {

        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        String st = status(election);

        var bundle = candidateService.bundleByElection(electionId);
        var candidates = bundle.items();
        int candidateCount = candidates.size();
        Map<UUID, String> candidateNameById = bundle.candidateNameById();

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

    public static String status(Instant now, Instant startsAt, Instant endsAt) {
        if (now.isBefore(startsAt))
            return "UPCOMING";
        if (!now.isBefore(endsAt))
            return "ENDED";
        return "ONGOING";
    }

    public static String status(Election e) {
        ElectionStatus s = e.getStatus();
        if (s == null)
            return "UNKNOWN";

        return switch (s) {
            case DRAFT, READY -> "UPCOMING";
            case OPEN -> "ONGOING";
            case CLOSED, TALLYING, TALLIED, PUBLISHED, ARCHIVED -> "ENDED"; // ★TALLYING追加
        };
    }

    public ElectionResultBundleResponse resultBundle(UUID electionId) {
        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

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

    public ElectionDetailResponse toDetailResponse(Election election) {
        String st = status(election);

        var bundle = candidateService.bundleByElection(election.getId());
        var candidates = bundle.items();
        int candidateCount = candidates.size();

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

        if (election.getStatus() != ElectionStatus.PUBLISHED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "RESULT_NOT_AVAILABLE",
                    "結果は選挙管理委員会の公開後に閲覧できます");
        }

        return allocResultInternal(electionId);
    }

    public AllocElectionResultResponse allocResultInternal(UUID electionId) {
        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        boolean partyAlloc = isPartyAllocationElection(election);

        long noneSupportPoints = voteAllocItemRepo.sumNoneSupportPointsByElection(electionId);

        Instant talliedAt = (election.getTalliedAt() != null) ? election.getTalliedAt() : Instant.now();

        if (partyAlloc) {
            var parties = partyRepo.findAll();

            Map<UUID, Long> pointMap = voteAllocItemRepo.sumPointsByElectionGroupByParty(electionId).stream()
                    .collect(Collectors.toMap(
                            VoteAllocItemRepository.PartyPointSum::getPartyId,
                            v -> v.getPts() != null ? v.getPts() : 0L));

            long totalPoints = pointMap.values().stream().mapToLong(Long::longValue).sum() + noneSupportPoints;

            var results = parties.stream()
                    .map(p -> new AllocElectionResultResponse.CandidatePointResult(
                            p.getId(),
                            p.getPartyKey(),
                            p.getName(),
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

        var candidates = candidateService.summariesByElection(electionId);

        Map<UUID, Long> pointMap = voteAllocItemRepo.sumPointsByElectionGroupByCandidate(electionId).stream()
                .collect(Collectors.toMap(
                        VoteAllocItemRepository.PointSum::getCandidateId,
                        v -> v.getPts() != null ? v.getPts() : 0L));

        long totalPoints = pointMap.values().stream().mapToLong(Long::longValue).sum() + noneSupportPoints;

        var results = candidates.stream()
                .map(c -> new AllocElectionResultResponse.CandidatePointResult(
                        c.candidateId(),
                        c.candidateKey(),
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
                talliedAt,
                results);
    }

    public ElectionResultResponse resultInternal(UUID electionId) {
        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

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
                .map(c -> new ElectionResultResponse.CandidateResult(
                        c.candidateId(),
                        c.candidateKey(),
                        c.name(),
                        countMap.getOrDefault(c.candidateId(), 0L)))
                .sorted((a, b) -> Long.compare(b.votes(), a.votes()))
                .toList();

        Instant talliedAt = (election.getTalliedAt() != null) ? election.getTalliedAt() : Instant.now();

        return new ElectionResultResponse(
                election.getId(),
                election.getTitle(),
                "CURRENT",
                totalVotes,
                talliedAt,
                results);
    }

    public ElectionResultResponse result(UUID electionId) {
        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        if (election.getStatus() != ElectionStatus.PUBLISHED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "RESULT_NOT_AVAILABLE",
                    "結果は選挙管理委員会の公開後に閲覧できます");
        }

        return resultInternal(electionId);
    }

    public ElectionResultBundleResponse committeeResultBundle(UUID electionId) {
        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        var st = election.getStatus();

        if (st == ElectionStatus.TALLYING) {
            throw new ApiException(HttpStatus.CONFLICT, "TALLY_IN_PROGRESS", "集計中です");
        }

        if (st != ElectionStatus.TALLIED && st != ElectionStatus.PUBLISHED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "RESULT_NOT_AVAILABLE", "結果は集計後に閲覧できます");
        }

        if (election.getBallotType() == BallotType.ALLOCATION) {
            return new ElectionResultBundleResponse(
                    election.getId(),
                    election.getBallotType().name(),
                    null,
                    allocResultInternal(electionId));
        }

        return new ElectionResultBundleResponse(
                election.getId(),
                election.getBallotType().name(),
                resultInternal(electionId),
                null);
    }

}