package com.bteam.ovs.elections.web;

import com.bteam.ovs.elections.repo.CandidateRepository;
import com.bteam.ovs.elections.repo.ElectionRepository;
import com.bteam.ovs.elections.web.dto.PublicCandidateItem;
import com.bteam.ovs.elections.web.dto.PublicElectionListItem;
import com.bteam.ovs.elections.web.dto.PublicElectionResultResponse;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.voting.repo.VoteCurrentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/public/elections")
public class PublicElectionController {

    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;
    private final VoteCurrentRepository voteCurrentRepo;

    public PublicElectionController(
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            VoteCurrentRepository voteCurrentRepo
    ) {
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
        this.voteCurrentRepo = voteCurrentRepo;
    }

    @GetMapping
    public List<PublicElectionListItem> list() {
        var now = Instant.now();

        var elections = electionRepo.findAllByOrderByStartsAtDesc();

        return elections.stream()
                .map(e -> {
                    String status;
                    if (now.isBefore(e.getStartsAt())) status = "UPCOMING";
                    else if (now.isAfter(e.getEndsAt())) status = "ENDED";
                    else status = "ONGOING";

                    boolean hasResult = "ENDED".equals(status);

                    return new PublicElectionListItem(
                            e.getId(),
                            e.getTitle(),
                            e.getStartsAt(),
                            e.getEndsAt(),
                            status,
                            hasResult
                    );
                })
                .toList();
    }

    @GetMapping("/{electionId}/candidates")
    public List<PublicCandidateItem> candidates(@PathVariable UUID electionId) {
        if (!electionRepo.existsById(electionId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません");
        }

        return candidateRepo.findByElectionId(electionId).stream()
                .map(c -> new PublicCandidateItem(c.getId(), c.getName()))
                .toList();
    }

    @GetMapping("/{electionId}/result")
    public PublicElectionResultResponse result(@PathVariable UUID electionId) {
        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        var now = Instant.now();
        if (now.isBefore(election.getEndsAt())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "RESULT_NOT_AVAILABLE", "結果は選挙終了後に公開されます");
        }

        var candidates = candidateRepo.findByElectionId(electionId);

        var countMap = voteCurrentRepo.countByElectionGroupByCandidate(electionId).stream()
                .collect(java.util.stream.Collectors.toMap(
                        VoteCurrentRepository.VoteCount::getCandidateId,
                        VoteCurrentRepository.VoteCount::getCnt
                ));

        long totalVotes = countMap.values().stream().mapToLong(Long::longValue).sum();

        var results = candidates.stream()
                .map(c -> new PublicElectionResultResponse.CandidateResult(
                        c.getId(),
                        c.getName(),
                        countMap.getOrDefault(c.getId(), 0L)
                ))
                .sorted((a, b) -> Long.compare(b.votes(), a.votes()))
                .toList();

        return new PublicElectionResultResponse(election.getId(), election.getTitle(), totalVotes, results);
    }
}
