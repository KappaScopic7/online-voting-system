package com.bteam.ovs.elections.web.dto;

import java.time.Instant;
import java.util.UUID;

public record ElectionResponse(
        UUID electionId,
        String title,
        Instant startsAt,
        Instant endsAt
) {}
