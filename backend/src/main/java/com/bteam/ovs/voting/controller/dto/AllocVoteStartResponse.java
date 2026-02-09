package com.bteam.ovs.voting.controller.dto;

import java.util.List;
import java.util.UUID;

public record AllocVoteStartResponse(
        UUID electionId,
        String electionTitle,
        int pointsPerVoter,
        List<OptionItem> options) {

    public record OptionItem(
            String type, // "CANDIDATE" | "PARTY" | "NONE_SUPPORT"
            UUID targetId, // NONE_SUPPORT は null
            String label) {
    }
}
