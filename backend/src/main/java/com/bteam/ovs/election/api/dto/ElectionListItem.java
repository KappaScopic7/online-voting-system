package com.bteam.ovs.election.api.dto;

import java.time.Instant;
import java.util.UUID;

public record ElectionListItem(
        UUID electionId,
        String title,
        Instant startsAt,
        Instant endsAt,
        boolean canVote,
        boolean alreadyVoted
) {}
