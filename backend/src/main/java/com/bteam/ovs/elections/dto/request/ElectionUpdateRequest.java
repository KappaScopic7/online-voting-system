package com.bteam.ovs.elections.dto.request;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record ElectionUpdateRequest(
        String title,
        @NotNull Instant startsAt,
        @NotNull Instant endsAt) {
}
