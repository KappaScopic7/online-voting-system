package com.bteam.ovs.elections.web.dto;

import java.time.Instant;
import java.util.UUID;

public record PublicElectionListItem(
        UUID electionId,
        String title,
        Instant startsAt,
        Instant endsAt,
        String status,   // "UPCOMING" | "ONGOING" | "ENDED"
        boolean hasResult
) {}
