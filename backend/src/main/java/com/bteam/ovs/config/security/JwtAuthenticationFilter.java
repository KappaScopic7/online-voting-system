package com.bteam.ovs.config.security;

import com.bteam.ovs.auth.entity.AccountKind;
import com.bteam.ovs.auth.entity.Role;
import com.bteam.ovs.shared.security.AuthPrincipal;
import com.bteam.ovs.shared.security.JwtClaims;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Objects;
import java.util.UUID;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {

        // 入口ログ（毎回）
        final String method = request.getMethod();
        final String path = request.getRequestURI();
        final String auth = request.getHeader("Authorization");
        log.info("[JWT] hit {} {} | authPresent={}", method, path, auth != null);

        if (auth == null) {
            chain.doFilter(request, response);
            return;
        }

        final String authTrim = auth.trim();
        if (authTrim.length() < 7 || !authTrim.regionMatches(true, 0, "Bearer ", 0, 7)) {
            log.info("[JWT] skip: Authorization is not Bearer scheme. value='{}'", shorten(authTrim, 80));
            chain.doFilter(request, response);
            return;
        }

        final String token = authTrim.substring(7).trim();
        if (token.isEmpty()) {
            log.info("[JWT] skip: Bearer token is empty");
            chain.doFilter(request, response);
            return;
        }

        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(jwtService.key())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            // まず「claimsに何が入ってるか」を見える化
            log.info("[JWT] parsed. subject='{}' keys={}",
                    claims.getSubject(),
                    claims.keySet());

            // 重要なclaimは “型なし get” で一度拾ってから String化する
            String sub = claims.getSubject();
            String aid = toStr(claims.get(JwtClaims.ACCOUNT_ID));
            String kindStr = toStr(claims.get(JwtClaims.KIND));
            String roleStr = toStr(claims.get(JwtClaims.ROLE));

            log.info("[JWT] extracted: aid='{}' kind='{}' role='{}' (claimKeys: accountId='{}' kind='{}' role='{}')",
                    aid, kindStr, roleStr,
                    JwtClaims.ACCOUNT_ID, JwtClaims.KIND, JwtClaims.ROLE);

            // 必須チェック
            if (isBlank(sub) || isBlank(aid) || isBlank(kindStr)) {
                log.info("[JWT] reject: missing required fields sub='{}' aid='{}' kind='{}'", sub, aid, kindStr);
                SecurityContextHolder.clearContext();
                chain.doFilter(request, response);
                return;
            }

            // UUID
            UUID accountId;
            try {
                accountId = UUID.fromString(aid);
            } catch (IllegalArgumentException e) {
                log.info("[JWT] reject: accountId is not UUID. aid='{}'", aid);
                SecurityContextHolder.clearContext();
                chain.doFilter(request, response);
                return;
            }

            // kind
            AccountKind kind;
            try {
                kind = AccountKind.valueOf(kindStr);
            } catch (IllegalArgumentException e) {
                log.info("[JWT] reject: invalid AccountKind. kind='{}' expected={}", kindStr,
                        java.util.Arrays.toString(AccountKind.values()));
                SecurityContextHolder.clearContext();
                chain.doFilter(request, response);
                return;
            }

            // role（任意だが、値があって不正なら reject）
            Role role = null;
            if (!isBlank(roleStr)) {
                try {
                    role = Role.valueOf(roleStr);
                } catch (IllegalArgumentException e) {
                    log.info("[JWT] reject: invalid Role. role='{}' expected={}", roleStr,
                            java.util.Arrays.toString(Role.values()));
                    SecurityContextHolder.clearContext();
                    chain.doFilter(request, response);
                    return;
                }
            }

            var authorities = new ArrayList<SimpleGrantedAuthority>();
            authorities.add(new SimpleGrantedAuthority("KIND_" + kind.name()));
            if (role != null)
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role.name()));

            var principal = new AuthPrincipal(accountId, sub, kind, role);
            var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.info("[JWT] accepted: accountId={} sub={} kind={} role={}", accountId, sub, kind, role);

        } catch (JwtException ex) {
            // ここに来るなら「署名/期限/フォーマット」系
            log.warn("[JWT] parse failed: {}", ex.getMessage());
            SecurityContextHolder.clearContext();
        }

        chain.doFilter(request, response);
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static String toStr(Object v) {
        if (v == null)
            return null;
        // たまにInteger/UUID/Mapで入ってる事故もあるので、とにかく文字列化して様子を見る
        return Objects.toString(v, null);
    }

    private static String shorten(String s, int max) {
        if (s == null)
            return null;
        if (s.length() <= max)
            return s;
        return s.substring(0, max) + "...";
    }
}
