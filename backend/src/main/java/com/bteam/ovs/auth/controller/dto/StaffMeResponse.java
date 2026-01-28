package com.bteam.ovs.auth.controller.dto;

import java.util.UUID;

import com.bteam.ovs.auth.entity.IdentityStatus;
import com.bteam.ovs.auth.entity.Role;

//import com.bteam.ovs.auth.entity.IdentityStatus;

public record StaffMeResponse (
    UUID accountId,
    String loginId,
    Role role,
    boolean enabled,
    boolean locked

//    IdentityStatus identityStatus
){}
