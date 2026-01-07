package com.bteam.ovs.elections.web.dto;

import java.util.List;
import java.util.UUID;

public record PublicElectionResultResponse(
        UUID electionId,
        String title,
        long totalVotes,
        List<CandidateResult> results
) {
    public record CandidateResult(UUID candidateId, String name, long votes) {}
}
