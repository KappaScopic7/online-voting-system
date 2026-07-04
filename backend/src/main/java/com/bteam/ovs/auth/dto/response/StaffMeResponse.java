package com.bteam.ovs.auth.dto.response;

import java.util.UUID;

import com.bteam.ovs.auth.entity.Role;

public record StaffMeResponse(
        UUID accountId,
        String loginId,
        Role role,
        boolean enabled,
        boolean locked) {
}
