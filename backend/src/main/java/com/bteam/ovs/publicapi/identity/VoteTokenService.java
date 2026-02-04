// backend/src/main/java/com/bteam/ovs/publicapi/identity/VoteTokenService.java
package com.bteam.ovs.publicapi.identity;

import com.bteam.ovs.config.security.JwtService;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class VoteTokenService {

    private final JwtService jwtService;

    public VoteTokenService(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public String issue(UUID citizenId, UUID electionId) {
        return jwtService.issueVoteToken(citizenId, electionId);
    }

    public long expiresInSeconds() {
        return 5 * 60;
    }
}
