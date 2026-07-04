package com.bteam.ovs.auth.dto.response;

import java.time.Instant;
import java.util.UUID;

import com.bteam.ovs.auth.entity.IdentityStatus;

public record MeDetailResponse(
        UUID accountId,
        String email,
        String role, // null or "VOTER"
        boolean emailVerified,
        boolean enabled,
        boolean locked,
        UUID citizenId, // null or UUID
        IdentityStatus identityStatus,
        Instant createdAt,
        Instant updatedAt) {
}
