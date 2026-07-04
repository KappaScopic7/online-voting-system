package com.bteam.ovs.elections.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ElectionResultResponse(
        UUID electionId,
        String title,
        String countingMethod,
        long totalVotes,
        Instant talliedAt,
        List<CandidateResult> results) {

    public record CandidateResult(
            UUID candidateId,
            String candidateKey,
            String candidateName,
            long votes) {
    }
}
