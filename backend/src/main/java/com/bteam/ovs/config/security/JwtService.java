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
// import java.util.HashMap;
import java.util.UUID;
import java.time.Duration;
// import java.util.Map;

@Component
public class JwtService {

    private final Key key;
    private final long expirationMinutes;

    public JwtService(
            @Value("${security.jwt.secret}") String secret,
            @Value("${security.jwt.expiration-minutes}") long expirationMinutes) {
        final int secretLen = secret == null ? 0 : secret.length();
        final String secretHead = preview(secret, 4);

        System.out.println("[JWT] init: secretLen=" + secretLen
                + " secretHead=" + secretHead
                + " expMin=" + expirationMinutes);

        try {
            this.key = Keys.hmacShaKeyFor((secret == null ? "" : secret).getBytes(StandardCharsets.UTF_8));
        } catch (RuntimeException e) {
            System.out.println("[JWT] init FAILED: invalid secret (len=" + secretLen + ") reason=" + e.getMessage());
            throw e;
        }

        this.expirationMinutes = expirationMinutes;
    }

    public String issueAccessToken(UUID accountId, String subject, Role role, AccountKind kind) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(expirationMinutes * 60);

        System.out.println("[JWT] issueAccessToken: accountId=" + accountId
                + " sub=" + safe(subject)
                + " kind=" + kind
                + " role=" + role
                + " iat=" + now
                + " exp=" + exp);

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

    private static String safe(String s) {
        if (s == null)
            return "null";
        if (s.length() <= 64)
            return s;
        return s.substring(0, 64) + "...";
    }

    private static String preview(String s, int n) {
        if (s == null)
            return "null";
        if (s.isEmpty())
            return "(empty)";
        int len = s.length();
        int k = Math.min(Math.max(n, 0), len);
        String head = s.substring(0, k);
        return head + "...(len=" + len + ")";
    }

    public String issueVoteToken(UUID citizenId, UUID electionId, Duration ttl) {
        Instant now = Instant.now();
        long sec = Math.max(30, ttl == null ? 300 : ttl.toSeconds());
        Instant exp = now.plusSeconds(sec);

        System.out.println("[JWT] issueVoteToken: citizenId=" + citizenId
                + " electionId=" + electionId
                + " ttlSec=" + sec
                + " iat=" + now
                + " exp=" + exp);

        return Jwts.builder()
                .setSubject(citizenId.toString())
                .claim(JwtClaims.KIND, "VOTE")
                .claim("eid", electionId.toString())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(exp))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String issueVoteToken(UUID citizenId, UUID electionId) {
        return issueVoteToken(citizenId, electionId, Duration.ofMinutes(30));
    }

    // private String issueJwt(String subject, Map<String, Object> claims, Duration
    // ttl) {
    // Instant now = Instant.now();
    // long sec = Math.max(30, ttl == null ? 300 : ttl.toSeconds());
    // Instant exp = now.plusSeconds(sec);

    // var b = Jwts.builder()
    // .setSubject(subject)
    // .setIssuedAt(Date.from(now))
    // .setExpiration(Date.from(exp));

    // if (claims != null) {
    // for (var e : claims.entrySet()) {
    // b.claim(e.getKey(), e.getValue());
    // }
    // }

    // return b.signWith(key, SignatureAlgorithm.HS256).compact();
    // }

    // public String issuePublicSessionToken(UUID citizenId) {
    // Instant now = Instant.now();

    // System.out.println("[JWT] issuePublicSessionToken: citizenId=" + citizenId
    // + " ttlMin=30"
    // + " iat=" + now);

    // Map<String, Object> claims = new HashMap<>();
    // claims.put(JwtClaims.KIND, "PUBLIC");

    // // exp は “本人認証の有効期限” として 30分（好きに調整OK）
    // return issueJwt(citizenId.toString(), claims, Duration.ofMinutes(30));
    // }

    public String issuePublicSessionToken(UUID citizenId, Duration ttl) {
        Instant now = Instant.now();
        long sec = Math.max(30, ttl == null ? 1800 : ttl.toSeconds());
        Instant exp = now.plusSeconds(sec);

        return Jwts.builder()
                .setSubject(citizenId.toString())
                .claim(JwtClaims.KIND, "PUBLIC")
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(exp))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String issuePublicSessionToken(UUID citizenId) {
        return issuePublicSessionToken(citizenId, Duration.ofMinutes(30));
    }

}
