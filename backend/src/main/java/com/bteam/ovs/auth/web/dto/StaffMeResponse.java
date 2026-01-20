package com.bteam.ovs.auth.web.dto;

import java.util.UUID;

import com.bteam.ovs.auth.model.Role;

public record StaffMeResponse (
    UUID accountId,
    String loginId,
    Role role,
    boolean enabled,
    boolean locked
){}
