// backend/src/main/java/com/bteam/ovs/shared/security/PrincipalExtractor.java
package com.bteam.ovs.shared.security;

import com.bteam.ovs.auth.entity.AccountKind;
import com.bteam.ovs.auth.entity.Role;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;

import java.util.UUID;

public final class PrincipalExtractor {
    private PrincipalExtractor() {
    }

    public static AuthPrincipal requirePrincipal(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }
        Object p = auth.getPrincipal();
        if (p instanceof AuthPrincipal ap)
            return ap;
        throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "認証情報が不正です");
    }

    public static UUID requireAccountId(Authentication auth) {
        return requirePrincipal(auth).accountId();
    }

    public static String requireSubject(Authentication auth) {
        String sub = requirePrincipal(auth).subject();
        if (sub == null || sub.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "認証情報が不正です");
        }
        return sub;
    }

    public static AccountKind requireKind(Authentication auth) {
        AccountKind kind = requirePrincipal(auth).kind();
        if (kind == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "認証情報が不正です");
        }
        return kind;
    }

    public static Role optionalRole(Authentication auth) {
        return requirePrincipal(auth).role();
    }

    public static UUID optionalAccountId(Authentication auth) {
        if (auth == null)
            return null;
        Object p = auth.getPrincipal();
        if (p instanceof AuthPrincipal ap)
            return ap.accountId();
        return null;
    }

    public static UUID optionalUserAccountId(Authentication auth) {
        if (auth == null)
            return null;
        Object p = auth.getPrincipal();
        if (!(p instanceof AuthPrincipal ap))
            return null;
        if (ap.kind() != AccountKind.USER)
            return null;
        return ap.accountId();
    }
}
