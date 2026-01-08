package com.bteam.ovs.elections.web;

import com.bteam.ovs.elections.repo.CandidateRepository;
import com.bteam.ovs.elections.repo.ElectionRepository;
import com.bteam.ovs.elections.service.ElectionService;
import com.bteam.ovs.elections.web.dto.ElectionListItem;
import com.bteam.ovs.elections.web.dto.CandidateItem;
import com.bteam.ovs.elections.web.dto.ElectionResultResponse;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.voting.repo.VoteCurrentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/elections")
public class ElectionsController {

    private final ElectionService electionService;
    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;
    private final VoteCurrentRepository voteCurrentRepo;

    public ElectionsController(
            ElectionService electionService,
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            VoteCurrentRepository voteCurrentRepo
    ) {
        this.electionService = electionService;
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
        this.voteCurrentRepo = voteCurrentRepo;
    }

    @GetMapping
    public List<ElectionListItem> list(Authentication auth) {
        UUID accountId = null;

        if (auth != null && auth.getName() != null) {
            try {
                accountId = UUID.fromString(auth.getName()); // principal=aid
            } catch (IllegalArgumentException ex) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
            }
        }

        return electionService.list(accountId);
    }

    @GetMapping("/{electionId}/candidates")
    public List<CandidateItem> candidates(@PathVariable UUID electionId) {
        if (!electionRepo.existsById(electionId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません");
        }

        return candidateRepo.findByElectionId(electionId).stream()
                .map(c -> new CandidateItem(c.getId(), c.getName()))
                .toList();
    }

    @GetMapping("/{electionId}/result")
    public ElectionResultResponse result(@PathVariable UUID electionId) {
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
}
