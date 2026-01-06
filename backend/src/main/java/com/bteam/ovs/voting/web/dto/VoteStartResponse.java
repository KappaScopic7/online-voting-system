package com.bteam.ovs.voting.web.dto;

import java.util.List;
import java.util.UUID;

public record VoteStartResponse(
        UUID electionId,
        String electionTitle,
        List<CandidateItem> candidates
) {
    public record CandidateItem(UUID id, String name) {}
}
