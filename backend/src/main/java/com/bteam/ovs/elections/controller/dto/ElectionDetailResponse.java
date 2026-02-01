package com.bteam.ovs.elections.controller.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.bteam.ovs.candidates.controller.dto.CandidateItem;

public record ElectionDetailResponse(
        UUID electionId,
        String title,
        Instant startsAt,
        Instant endsAt,
        String status,
        int candidateCount,
        List<CandidateItem> candidates,
        boolean canCast,
        ElectionListItem.CurrentVote currentVote) {
}
