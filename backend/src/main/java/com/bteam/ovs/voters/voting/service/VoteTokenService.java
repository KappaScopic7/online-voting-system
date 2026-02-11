// backend/src/main/java/com/bteam/ovs/voters/voting/service/VoteTokenService.java
package com.bteam.ovs.voters.voting.service;

import com.bteam.ovs.config.security.JwtService;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
public class VoteTokenService {

    private final JwtService jwtService;

    public VoteTokenService(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public String issue(UUID citizenId, UUID electionId) {
        if (citizenId == null || electionId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "入力が不正です");
        }

        // ✅ electionId は入力検証に使うだけ（「その選挙で認証してる」導線維持）
        // ✅ 発行するのは PUBLIC（選挙を跨いで使える）
        return jwtService.issuePublicSessionToken(citizenId, Duration.ofMinutes(10));
    }
}
