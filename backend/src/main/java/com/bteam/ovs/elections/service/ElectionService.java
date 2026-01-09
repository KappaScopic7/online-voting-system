package com.bteam.ovs.elections.service;

import com.bteam.ovs.auth.repo.UserAccountRepository;
import com.bteam.ovs.elections.repo.CandidateRepository;
import com.bteam.ovs.elections.repo.ElectionRepository;
import com.bteam.ovs.elections.web.dto.CandidateItem;
import com.bteam.ovs.elections.web.dto.ElectionListItem;
import com.bteam.ovs.elections.web.dto.ElectionResultResponse;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.voting.repo.VoteCurrentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ElectionService {

    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;
    private final VoteCurrentRepository voteCurrentRepo;
    private final UserAccountRepository userRepo;

    public ElectionService(
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            VoteCurrentRepository voteCurrentRepo,
            UserAccountRepository userRepo
    ) {
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
        this.voteCurrentRepo = voteCurrentRepo;
        this.userRepo = userRepo;
    }

    // ======================
    // GET /api/elections
    // ======================
    public List<ElectionListItem> list(UUID accountIdOrNull) {
        var now = Instant.now();

        var elections = electionRepo.findAllByOrderByStartsAtDesc();
        if (elections.isEmpty()) return List.of();

        var electionIds = elections.stream().map(e -> e.getId()).toList();

        var countMap = candidateRepo.countByElectionIdIn(electionIds).stream()
                .collect(Collectors.toMap(
                        CandidateRepository.ElectionCandidateCount::getElectionId,
                        CandidateRepository.ElectionCandidateCount::getCnt
                ));

        var candidateNameById = candidateRepo.findByElectionIdIn(electionIds).stream()
                .collect(Collectors.toMap(
                        c -> c.getId(),
                        c -> c.getName(),
                        (a, b) -> a
                ));

        UUID citizenId = null;
        boolean identityLinked = false;

        if (accountIdOrNull != null) {
            var acc = userRepo.findById(accountIdOrNull)
                    .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));
            citizenId = acc.getCitizenId();
            identityLinked = (citizenId != null);
        }

        Map<UUID, com.bteam.ovs.voting.model.VoteCurrent> currentByElectionId = Map.of();
        if (identityLinked) {
            currentByElectionId = voteCurrentRepo.findByCitizenIdAndElectionIdIn(citizenId, electionIds).stream()
                    .collect(Collectors.toMap(
                            v -> v.getElectionId(),
                            v -> v,
                            (a, b) -> a
                    ));
        }

        var finalIdentityLinked = identityLinked;
        var finalCurrentByElectionId = currentByElectionId;

        return elections.stream()
                .map(e -> {
                    String st = status(now, e.getStartsAt(), e.getEndsAt());
                    boolean hasResult = "ENDED".equals(st);
                    int candidateCount = Math.toIntExact(countMap.getOrDefault(e.getId(), 0L));

                    boolean canCast = finalIdentityLinked && "ONGOING".equals(st);

                    ElectionListItem.CurrentVote currentVote = null;
                    if (finalIdentityLinked) {
                        var cur = finalCurrentByElectionId.get(e.getId());
                        if (cur != null) {
                            var cid = cur.getCandidateId();
                            currentVote = new ElectionListItem.CurrentVote(
                                    cid,
                                    candidateNameById.get(cid),
                                    cur.getCastedAt()
                            );
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
                            currentVote
                    );
                })
                .toList();
    }

    // ======================
    // GET /api/elections/{id}/candidates
    // ======================
    public List<CandidateItem> candidates(UUID electionId) {
        if (!electionRepo.existsById(electionId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません");
        }

        return candidateRepo.findByElectionId(electionId).stream()
                .map(c -> new CandidateItem(c.getId(), c.getName()))
                .toList();
    }

    // ======================
    // GET /api/elections/{id}/result
    // ======================
    public ElectionResultResponse result(UUID electionId) {
        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        var now = Instant.now();
        if (now.isBefore(election.getEndsAt())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "RESULT_NOT_AVAILABLE", "結果は選挙終了後に公開されます");
        }

        var candidates = candidateRepo.findByElectionId(electionId);

        var countMap = voteCurrentRepo.countByElectionGroupByCandidate(electionId).stream()
                .collect(Collectors.toMap(
                        VoteCurrentRepository.VoteCount::getCandidateId,
                        VoteCurrentRepository.VoteCount::getCnt
                ));

        long totalVotes = countMap.values().stream().mapToLong(Long::longValue).sum();

        var results = candidates.stream()
                .map(c -> new ElectionResultResponse.CandidateResult(
                        c.getId(),
                        c.getName(),
                        countMap.getOrDefault(c.getId(), 0L)
                ))
                .sorted((a, b) -> Long.compare(b.votes(), a.votes()))
                .toList();

        return new ElectionResultResponse(
                election.getId(),
                election.getTitle(),
                "CURRENT",
                totalVotes,
                now,
                results
        );
    }

    public static String status(Instant now, Instant startsAt, Instant endsAt) {
        if (now.isBefore(startsAt)) return "UPCOMING";
        if (!now.isBefore(endsAt)) return "ENDED";
        return "ONGOING";
    }
}
