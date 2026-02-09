package com.bteam.ovs.shared.security;

import com.bteam.ovs.auth.entity.AccountKind;
import com.bteam.ovs.auth.entity.Role;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("authz")
public class AuthzBean {
    public boolean isKind(Authentication auth, AccountKind kind) {
        return Authz.isKind(auth, kind);
    }

    public boolean hasRole(Authentication auth, Role role) {
        return Authz.hasRole(auth, role);
    }

    public boolean hasAnyRole(Authentication auth, Role... roles) {
        return Authz.hasAnyRole(auth, roles);
    }
}
