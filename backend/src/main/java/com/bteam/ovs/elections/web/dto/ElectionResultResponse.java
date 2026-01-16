package com.bteam.ovs.elections.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ElectionResultResponse(
        UUID electionId,
        String title,
        String countingMethod,
        long totalVotes,
        Instant talliedAt,
        List<CandidateResult> results
) {
    public record CandidateResult(
            UUID candidateId,
            String name,
            long votes
    ) {}
}
