// backend/src/main/java/com/bteam/ovs/config/security/JwtService.java
package com.bteam.ovs.config.security;

import com.bteam.ovs.auth.entity.AccountKind;
import com.bteam.ovs.auth.entity.Role;
import com.bteam.ovs.shared.security.JwtClaims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtService {

    private final Key key;
    private final long expirationMinutes;

    public JwtService(
            @Value("${security.jwt.secret}") String secret,
            @Value("${security.jwt.expiration-minutes}") long expirationMinutes) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMinutes = expirationMinutes;
    }

    public String issueAccessToken(UUID accountId, String subject, Role role, AccountKind kind) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(expirationMinutes * 60);

        var b = Jwts.builder()
                .setSubject(subject)
                .claim(JwtClaims.ACCOUNT_ID, accountId.toString())
                .claim(JwtClaims.KIND, kind.name())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(exp));

        if (role != null) {
            b.claim(JwtClaims.ROLE, role.name());
        }

        return b.signWith(key, SignatureAlgorithm.HS256).compact();
    }

    public long expiresInSeconds() {
        return expirationMinutes * 60;
    }

    public Key key() {
        return key;
    }
}
