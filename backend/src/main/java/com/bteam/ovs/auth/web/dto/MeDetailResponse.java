package com.bteam.ovs.auth.web.dto;

import com.bteam.ovs.auth.model.IdentityStatus;

import java.time.Instant;
import java.util.UUID;

public record MeDetailResponse(
        UUID accountId,
        String email,
        String role,            // null or "VOTER"
        boolean emailVerified,
        boolean enabled,
        boolean locked,
        UUID citizenId,         // null or UUID
        IdentityStatus identityStatus,
        Instant createdAt,
        Instant updatedAt
) {}
