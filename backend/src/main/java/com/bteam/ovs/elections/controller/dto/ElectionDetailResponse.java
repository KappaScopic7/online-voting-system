package com.bteam.ovs.elections.controller.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ElectionDetailResponse(
        UUID id,
        String title,
        Instant startsAt,
        Instant endsAt,
        String status,
        int candidateCount,
        List<CandidateItem> candidates,
        boolean canCast,
        ElectionListItem.CurrentVote currentVote) {
}
