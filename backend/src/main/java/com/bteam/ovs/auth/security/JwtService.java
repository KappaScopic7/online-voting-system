package com.bteam.ovs.auth.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.bteam.ovs.auth.model.Role;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtService {

    public enum AccountKind {
        PORTAL,
        COMMITTEE
    }

    private final Key key;
    private final long expirationMinutes;

    public JwtService(
            @Value("${security.jwt.secret}") String secret,
            @Value("${security.jwt.expiration-minutes}") long expirationMinutes
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMinutes = expirationMinutes;
    }

    public String issueAccessToken(UUID accountId, String subject, Role role, AccountKind kind) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(expirationMinutes * 60);

        return Jwts.builder()
                .setSubject(subject)                 // portal: email / committee: loginId（識別用）
                .claim("aid", accountId.toString())
                .claim("role", role.name())
                .claim("kind", kind.name())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(exp))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public long expiresInSeconds() {
        return expirationMinutes * 60;
    }

    public Key key() {
        return key;
    }
}
