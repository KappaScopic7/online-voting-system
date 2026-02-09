package com.bteam.ovs.shared.security;

import com.bteam.ovs.auth.entity.AccountKind;
import com.bteam.ovs.auth.entity.Role;
import org.springframework.security.core.Authentication;
import org.springframework.security.authorization.AuthorizationDecision;

public final class Authz {
    private Authz() {
    }

    /**
     * PreAuthorize 用の SpEL 文字列
     * 例: @PreAuthorize(Authz.STAFF)
     */
    public static final String STAFF = "@authz.isKind(authentication, T(com.bteam.ovs.auth.entity.AccountKind).STAFF)";

    public static final String USER = "@authz.isKind(authentication, T(com.bteam.ovs.auth.entity.AccountKind).USER)";

    // 必要なら役割も用意（例：管理者だけ）
    public static final String STAFF_ADMIN = "@authz.isKind(authentication, T(com.bteam.ovs.auth.entity.AccountKind).STAFF) "
            + "and @authz.hasRole(authentication, T(com.bteam.ovs.auth.entity.Role).ADMIN)";

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
            if (hasRole(auth, r))
                return true;
        }
        return false;
    }

    public static AuthorizationDecision decide(boolean allowed) {
        return new AuthorizationDecision(allowed);
    }

    public static AuthorizationDecision decide(Authentication auth, AccountKind kind) {
        return decide(isKind(auth, kind));
    }

    public static AuthorizationDecision decide(Authentication auth, AccountKind kind, Role role) {
        return decide(isKind(auth, kind) && hasRole(auth, role));
    }
}
