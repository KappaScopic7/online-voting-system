package com.bteam.ovs.voting.controller.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AllocVoteHistoryItem(
        UUID castId,
        UUID electionId,
        String electionTitle,
        String electionStatus,
        int pointsTotal,
        Instant castedAt,
        List<AllocItem> items) {

    public record AllocItem(
            String type, // "CANDIDATE" | "PARTY" | "NONE_SUPPORT"
            UUID targetId, // NONE_SUPPORT は null
            String label,
            int points) {
    }
}
