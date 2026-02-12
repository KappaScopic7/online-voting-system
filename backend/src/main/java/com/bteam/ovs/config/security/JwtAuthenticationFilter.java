package com.bteam.ovs.config.security;

import com.bteam.ovs.auth.entity.AccountKind;
import com.bteam.ovs.auth.entity.Role;
import com.bteam.ovs.shared.security.AuthPrincipal;
import com.bteam.ovs.shared.security.JwtClaims;
import com.bteam.ovs.shared.security.VotePrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import com.bteam.ovs.shared.security.PublicPrincipal;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Objects;
import java.util.UUID;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {

        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            chain.doFilter(request, response);
            return;
        }

        final String method = request.getMethod();
        final String path = request.getRequestURI();
        final String auth = request.getHeader("Authorization");

        System.out.println("[JWT] hit " + method + " " + path + " authPresent=" + (auth != null));

        if (auth == null) {
            chain.doFilter(request, response);
            return;
        }

        final String authTrim = auth.trim();
        if (authTrim.length() < 7 || !authTrim.regionMatches(true, 0, "Bearer ", 0, 7)) {
            System.out.println("[JWT] skip: not Bearer scheme. valueHead=" + preview(authTrim, 16));
            chain.doFilter(request, response);
            return;
        }

        final String token = authTrim.substring(7).trim();
        if (token.isEmpty()) {
            System.out.println("[JWT] skip: Bearer token is empty");
            chain.doFilter(request, response);
            return;
        }

        System.out.println("[JWT] tokenPresent len=" + token.length() + " head=" + preview(token, 12));

        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(jwtService.key())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            System.out.println("[JWT] parsed OK. claimKeys=" + claims.keySet()
                    + " sub=" + safe(claims.getSubject()));

            String sub = claims.getSubject();
            String kindStr = toStr(claims.get(JwtClaims.KIND));

            System.out.println("[JWT] extracted kind=" + safe(kindStr));

            if ("VOTE".equalsIgnoreCase(kindStr)) {
                if (isBlank(sub)) {
                    System.out.println("[JWT] reject(VOTE): subject missing");
                    SecurityContextHolder.clearContext();
                    chain.doFilter(request, response);
                    return;
                }

                String eid = toStr(claims.get("eid"));
                if (isBlank(eid)) {
                    System.out.println("[JWT] reject(VOTE): eid missing");
                    SecurityContextHolder.clearContext();
                    chain.doFilter(request, response);
                    return;
                }

                UUID citizenId;
                UUID electionId;
                try {
                    citizenId = UUID.fromString(sub);
                } catch (IllegalArgumentException e) {
                    System.out.println("[JWT] reject(VOTE): citizenId not UUID. sub=" + safe(sub));
                    SecurityContextHolder.clearContext();
                    chain.doFilter(request, response);
                    return;
                }

                try {
                    electionId = UUID.fromString(eid);
                } catch (IllegalArgumentException e) {
                    System.out.println("[JWT] reject(VOTE): electionId not UUID. eid=" + safe(eid));
                    SecurityContextHolder.clearContext();
                    chain.doFilter(request, response);
                    return;
                }

                var authorities = new ArrayList<SimpleGrantedAuthority>();
                authorities.add(new SimpleGrantedAuthority("KIND_VOTE"));

                var principal = new VotePrincipal(citizenId, electionId);
                var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);

                System.out.println("[JWT] accepted(VOTE): citizenId=" + citizenId + " electionId=" + electionId);
                chain.doFilter(request, response);
                return;
            }

            if ("PUBLIC".equalsIgnoreCase(kindStr)) {
                if (isBlank(sub)) {
                    System.out.println("[JWT] reject(PUBLIC): subject missing");
                    SecurityContextHolder.clearContext();
                    chain.doFilter(request, response);
                    return;
                }

                UUID citizenId;
                try {
                    citizenId = UUID.fromString(sub);
                } catch (IllegalArgumentException e) {
                    System.out.println("[JWT] reject(PUBLIC): citizenId not UUID. sub=" + safe(sub));
                    SecurityContextHolder.clearContext();
                    chain.doFilter(request, response);
                    return;
                }

                var authorities = new ArrayList<SimpleGrantedAuthority>();
                authorities.add(new SimpleGrantedAuthority("KIND_PUBLIC"));

                var principal = new PublicPrincipal(citizenId);
                var authentication = new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);

                System.out.println("[JWT] accepted(PUBLIC): citizenId=" + citizenId);
                chain.doFilter(request, response);
                return;
            }

            String aid = toStr(claims.get(JwtClaims.ACCOUNT_ID));
            String roleStr = toStr(claims.get(JwtClaims.ROLE));

            System.out.println("[JWT] extracted aid=" + safe(aid)
                    + " kind=" + safe(kindStr)
                    + " role=" + safe(roleStr));

            if (isBlank(sub) || isBlank(aid) || isBlank(kindStr)) {
                System.out.println("[JWT] reject: missing required fields"
                        + " subBlank=" + isBlank(sub)
                        + " aidBlank=" + isBlank(aid)
                        + " kindBlank=" + isBlank(kindStr));
                SecurityContextHolder.clearContext();
                chain.doFilter(request, response);
                return;
            }

            UUID accountId;
            try {
                accountId = UUID.fromString(aid);
            } catch (IllegalArgumentException e) {
                System.out.println("[JWT] reject: accountId not UUID. aid=" + safe(aid));
                SecurityContextHolder.clearContext();
                chain.doFilter(request, response);
                return;
            }

            AccountKind kind;
            try {
                kind = AccountKind.valueOf(kindStr);
            } catch (IllegalArgumentException e) {
                System.out.println("[JWT] reject: invalid AccountKind. kind=" + safe(kindStr));
                SecurityContextHolder.clearContext();
                chain.doFilter(request, response);
                return;
            }

            Role role = null;
            if (!isBlank(roleStr)) {
                try {
                    role = Role.valueOf(roleStr);
                } catch (IllegalArgumentException e) {
                    System.out.println("[JWT] reject: invalid Role. role=" + safe(roleStr));
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

            System.out.println("[JWT] accepted: accountId=" + accountId + " sub=" + safe(sub)
                    + " kind=" + kind + " role=" + role);

        } catch (JwtException ex) {
            System.out.println("[JWT] parse FAILED: " + ex.getClass().getSimpleName() + " msg=" + ex.getMessage());
            SecurityContextHolder.clearContext();
        } catch (RuntimeException ex) {
            System.out.println("[JWT] unexpected error: " + ex.getClass().getSimpleName() + " msg=" + ex.getMessage());
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
        return Objects.toString(v, null);
    }

    private static String safe(String s) {
        if (s == null)
            return "null";
        if (s.length() <= 80)
            return s;
        return s.substring(0, 80) + "...";
    }

    private static String preview(String s, int head) {
        if (s == null)
            return "null";
        if (s.isEmpty())
            return "(empty)";
        int len = s.length();
        int k = Math.min(Math.max(head, 0), len);
        return s.substring(0, k) + "...(len=" + len + ")";
    }
}
