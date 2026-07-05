// backend/src/main/java/com/bteam/ovs/shared/security/JwtClaims.java
package com.bteam.ovs.shared.security;

import lombok.NoArgsConstructor;

@NoArgsConstructor
public final class JwtClaims {

    public static final String ACCOUNT_ID = "aid";
    public static final String KIND = "kind";
    public static final String ROLE = "role";
}
