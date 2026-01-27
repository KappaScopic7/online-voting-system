// backend/src/main/java/com/bteam/ovs/shared/security/Authz.java
package com.bteam.ovs.shared.security;

import com.bteam.ovs.auth.entity.AccountKind;
import com.bteam.ovs.auth.entity.Role;
import org.springframework.security.core.Authentication;

public final class Authz {
    private Authz() {
    }

    public static boolean isKind(Authentication auth, AccountKind kind) {
        if (auth == null || kind == null)
            return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("KIND_" + kind.name()));
    }

    public static boolean hasRole(Authentication auth, Role role) {
        if (auth == null || role == null)
            return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role.name()));
    }

    public static boolean hasAnyRole(Authentication auth, Role... roles) {
        if (auth == null || roles == null)
            return false;
        for (Role r : roles) {
            if (r != null && hasRole(auth, r))
                return true;
        }
        return false;
    }
}
