package com.bteam.ovs.profile.web.dto;

import java.time.Instant;
import java.util.UUID;

public record MeProfileResponse(
        UUID accountId,
        String source,     // "SELF" 固定（将来 CITIZEN と統一する用）
        String birthDate,  // yyyy-MM-dd
        String prefCode,
        String cityCode,
        Instant createdAt,
        Instant updatedAt
) {}
