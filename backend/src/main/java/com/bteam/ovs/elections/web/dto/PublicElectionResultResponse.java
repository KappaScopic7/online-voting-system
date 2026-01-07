package com.bteam.ovs.elections.web.dto;

import java.util.List;
import java.util.UUID;
import java.time.Instant;

public record PublicElectionResultResponse(
        UUID electionId,
        String title,
        String countingMethod, // "CURRENT" 固定（VoteCurrent集計）
        long totalVotes,       // 有効票数（VoteCurrent件数）
        Instant talliedAt,     // 集計時刻
        List<CandidateResult> results
) {
    public record CandidateResult(
            UUID candidateId,
            String name,
            long votes
    ) {}
}
