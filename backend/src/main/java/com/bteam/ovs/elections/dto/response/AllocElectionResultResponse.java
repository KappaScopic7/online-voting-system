package com.bteam.ovs.elections.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AllocElectionResultResponse(
        UUID electionId,
        String electionTitle,
        String resultKind,
        long totalPoints,
        long noneSupportPoints,
        Instant generatedAt,
        List<CandidatePointResult> results) {

    public record CandidatePointResult(
            UUID candidateId,
            String candidateKey,
            String name,
            long points) {
    }
}
