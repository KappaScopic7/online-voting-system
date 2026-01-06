package com.bteam.ovs.voting.web.dto;

import java.time.Instant;
import java.util.UUID;

public record VoteHistoryItem(
        UUID voteId,
        UUID electionId,
        String electionTitle,
        UUID candidateId,
        String candidateName,
        Instant castedAt
) {}
