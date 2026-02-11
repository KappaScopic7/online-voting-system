package com.bteam.ovs.elections.controller.dto;

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
        CurrentVote currentVote,
        String ballotType,
        boolean hasCurrent // ★追加（どの投票方式でも「現時点で投票済み」）
) {
    public record CurrentVote(
            UUID candidateId,
            String candidateName,
            Instant castedAt) {
    }
}
