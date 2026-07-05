package com.bteam.ovs.auth.dto.response;

import java.util.UUID;
import com.bteam.ovs.auth.entity.IdentityStatus;

public record MeResponse(
        UUID accountId,
        String email,
        String role,
        boolean emailVerified,
        IdentityStatus identityStatus) {
}
