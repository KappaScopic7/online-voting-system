package com.bteam.ovs.elections.web.dto;

import java.time.Instant;
import java.util.UUID;

public record ElectionListItem(
        UUID electionId,
        String title,
        Instant startsAt,
        Instant endsAt,
        String status,
        boolean hasResult,
        int candidateCount,
        boolean canCast,
        CurrentVote currentVote
) {
    public record CurrentVote(
            UUID candidateId,
            String candidateName,
            Instant castedAt
    ) {}
}
