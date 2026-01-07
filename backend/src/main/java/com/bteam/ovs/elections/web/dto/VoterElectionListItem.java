package com.bteam.ovs.elections.web.dto;

import java.time.Instant;
import java.util.UUID;

public record VoterElectionListItem(
    UUID electionId,
    String title,
    Instant startsAt,
    Instant endsAt,
    String status,          // UPCOMING | ONGOING | ENDED
    boolean canCast,        // 本人認証済み & status==ONGOING
    CurrentVote currentVote // null 可（未投票ならnull）
) {
    public record CurrentVote(
        UUID candidateId,
        String candidateName, // 現状はnull運用（joinしない）
        Instant castedAt
    ) {}
}
