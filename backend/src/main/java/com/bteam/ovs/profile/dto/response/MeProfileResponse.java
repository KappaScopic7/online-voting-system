package com.bteam.ovs.profile.dto.response;

import java.time.Instant;
import java.util.UUID;

public record MeProfileResponse(
        UUID accountId,
        String source, // "SELF" | "CITIZEN"
        String birthDate, // yyyy-MM-dd
        String prefCode,
        String cityCode,
        Instant createdAt,
        Instant updatedAt) {
}
