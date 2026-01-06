package com.bteam.ovs.auth.api.dto;

import java.util.UUID;

public record MeResponse(
        UUID accountId,
        String email,
        String role,
        boolean emailVerified,
        boolean identityLinked
) {}
