// com/bteam/ovs/shared/security/VotePrincipal.java
package com.bteam.ovs.shared.security;

import java.util.UUID;

public record VotePrincipal(UUID citizenId, UUID electionId /* nullable */) {
}
