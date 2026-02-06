// backend/src/main/java/com/bteam/ovs/publicapi/identity/VoteTokenService.java
package com.bteam.ovs.publicapi.identity;

import com.bteam.ovs.config.security.JwtService;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
public class VoteTokenService {

    // ★ 期限はここで一元管理（expもこれで切る）
    private static final Duration TTL = Duration.ofMinutes(10);

    private final JwtService jwtService;

    public VoteTokenService(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public String issue(UUID citizenId, UUID electionId) {
        // ★ JwtService 側に「TTL指定版」を用意するのが一番ズレない
        return jwtService.issueVoteToken(citizenId, electionId, TTL);
    }

    public long expiresInSeconds() {
        return TTL.toSeconds();
    }
}
