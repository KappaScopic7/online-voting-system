package com.bteam.ovs.demo.json;

import com.bteam.ovs.auth.entity.Role;

public record CommitteeJson(String loginId, String password, Role role,
        String assignedPrefCode, String assignedCityCode,
        boolean enabled, boolean locked) {
}