package com.bteam.ovs.voting.controller.dto;

import java.time.Instant;
import java.util.UUID;

public record VoteHistoryItem(
        UUID voteId,
        UUID electionId,
        String electionTitle,
        String electionStatus, // ★ 追加
        UUID candidateId,
        String candidateName,
        Instant castedAt) {
}
