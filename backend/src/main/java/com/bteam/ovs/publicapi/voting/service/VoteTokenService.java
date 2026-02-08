package com.bteam.ovs.publicapi.voting.service;

import com.bteam.ovs.config.security.JwtService;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.shared.security.JwtClaims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;
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

        Instant now = Instant.now();
        Instant exp = now.plusSeconds(10 * 60); // 10分

        return Jwts.builder()
                .setSubject(citizenId.toString())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(exp))
                .claim(JwtClaims.KIND, "VOTE")
                .claim("eid", electionId.toString())
                .signWith(jwtService.key(), SignatureAlgorithm.HS256)
                .compact();
    }
}
