package com.bteam.ovs.auth.web.dto;

import java.util.UUID;

public record MeResponse(
        UUID accountId,
        String email,
        String role,
        boolean emailVerified,
        boolean identityLinked
) {}
