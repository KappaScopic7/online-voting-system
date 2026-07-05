package com.bteam.ovs.elections.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import com.bteam.ovs.candidates.dto.response.CandidateListItem;

public record ElectionDetailResponse(
        UUID electionId,
        String title,
        Instant startsAt,
        Instant endsAt,
        String status,
        int candidateCount,
        List<CandidateListItem> candidates,
        boolean canCast,
        ElectionListItem.CurrentVote currentVote) {
}
