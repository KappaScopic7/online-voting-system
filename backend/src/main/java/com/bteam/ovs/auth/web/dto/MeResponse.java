package com.bteam.ovs.auth.web.dto;

import java.util.UUID;

import com.bteam.ovs.auth.model.IdentityStatus;

public record MeResponse(
        UUID accountId,
        String email,
        String role,
        boolean emailVerified,
        IdentityStatus identityStatus
) {}
