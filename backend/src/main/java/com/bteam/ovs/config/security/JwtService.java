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
        // ★ IMPORTANT: do NOT log the secret itself
        final int secretLen = secret == null ? 0 : secret.length();
        final String secretHead = preview(secret, 4); // 先頭だけ（さらに安全にするなら削除OK）

        // 起動時に「設定が読めてるか」だけ見える化
        System.out.println("[JWT] init: secretLen=" + secretLen
                + " secretHead=" + secretHead
                + " expMin=" + expirationMinutes);

        // HS256 用のキー生成（secret が短すぎると IllegalArgumentException になり得る）
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

        // 発行ログ（トークン本文は絶対出さない）
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

    public String issueVoteToken(UUID citizenId, UUID electionId) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(5 * 60);

        System.out.println("[JWT] issueVoteToken: citizenId=" + citizenId
                + " electionId=" + electionId
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

    // ===== helpers =====

    private static String safe(String s) {
        if (s == null)
            return "null";
        // メール等の可能性があるので、必要なら短縮
        if (s.length() <= 64)
            return s;
        return s.substring(0, 64) + "...";
    }

    /**
     * secret を直接出さないためのプレビュー。
     * 先頭数文字だけでも危険と感じるなら、常に "***" を返すようにしてOK。
     */
    private static String preview(String s, int n) {
        if (s == null)
            return "null";
        if (s.isEmpty())
            return "(empty)";
        int len = s.length();
        int k = Math.min(Math.max(n, 0), len);
        // 例: abcd...(len=40)
        String head = s.substring(0, k);
        return head + "...(len=" + len + ")";
    }
}
