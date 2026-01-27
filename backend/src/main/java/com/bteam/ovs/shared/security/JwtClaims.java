// backend/src/main/java/com/bteam/ovs/shared/security/JwtClaims.java
package com.bteam.ovs.shared.security;

public final class JwtClaims {
    private JwtClaims() {
    }

    public static final String ACCOUNT_ID = "aid";
    public static final String KIND = "kind";
    public static final String ROLE = "role";
}
