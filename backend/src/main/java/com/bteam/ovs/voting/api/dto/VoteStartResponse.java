package com.bteam.ovs.voting.api.dto;

import java.util.List;
import java.util.UUID;

public record VoteStartResponse(
        UUID electionId,
        String electionTitle,
        List<CandidateItem> candidates
) {
    public record CandidateItem(UUID id, String name) {}
}
