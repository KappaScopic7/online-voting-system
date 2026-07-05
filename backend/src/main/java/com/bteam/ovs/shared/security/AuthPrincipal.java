// backend/src/main/java/com/bteam/ovs/shared/security/AuthPrincipal.java
package com.bteam.ovs.shared.security;

import com.bteam.ovs.auth.entity.AccountKind;
import com.bteam.ovs.auth.entity.Role;
import java.util.UUID;

public record AuthPrincipal(
        UUID accountId,
        String subject, // email / loginId
        AccountKind kind, // USER / STAFF
        Role role // VOTER / ADMIN / COMMITTEE or null
) {
}
