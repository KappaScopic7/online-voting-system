package com.bteam.ovs.elections.dto.response;

import java.time.Instant;
import java.util.UUID;

public record ElectionResponse(
        UUID electionId,
        String title,
        Instant startsAt,
        Instant endsAt) {
}
