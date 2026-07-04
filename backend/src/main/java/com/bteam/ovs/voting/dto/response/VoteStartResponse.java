package com.bteam.ovs.voting.dto.response;

import java.util.List;
import java.util.UUID;

public record VoteStartResponse(
        UUID electionId,
        String title,
        List<CandidateItem> candidates) {
    public record CandidateItem(UUID candidateId, String name) {
    }
}
