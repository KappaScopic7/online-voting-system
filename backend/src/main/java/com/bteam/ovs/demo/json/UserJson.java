package com.bteam.ovs.demo.json;

import com.bteam.ovs.auth.entity.Role;
import java.util.UUID;

public record UserJson(String email, String password, Role role,
        boolean emailVerified, boolean enabled, boolean locked, UUID citizenId) {
}