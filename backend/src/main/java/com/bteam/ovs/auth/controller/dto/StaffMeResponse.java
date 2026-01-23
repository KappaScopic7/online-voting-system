package com.bteam.ovs.auth.controller.dto;

import java.util.UUID;

import com.bteam.ovs.auth.entity.Role;

public record StaffMeResponse (
    UUID accountId,
    String loginId,
    Role role,
    boolean enabled,
    boolean locked
){}
