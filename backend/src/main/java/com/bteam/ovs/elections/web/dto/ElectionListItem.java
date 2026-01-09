package com.bteam.ovs.elections.web.dto;

import java.time.Instant;
import java.util.UUID;

public record ElectionListItem(
        UUID electionId,
        String title,
        Instant startsAt,
        Instant endsAt,
        String status,       // UPCOMING | ONGOING | ENDED
        boolean hasResult,   // status==ENDED を基本にする想定
        int candidateCount,
        boolean canCast,     // (本人認証済み && status==ONGOING) など
        CurrentVote currentVote // 未投票なら null 可
) {
    public record CurrentVote(
            UUID candidateId,
            String candidateName, // 取得できるなら埋める。不要なら null でもOK
            Instant castedAt
    ) {}
}
