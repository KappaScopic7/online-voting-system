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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.UUID;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = auth.substring("Bearer ".length()).trim();

        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(jwtService.key())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String sub = claims.getSubject();
            String aid = claims.get(JwtClaims.ACCOUNT_ID, String.class);
            String kindStr = claims.get(JwtClaims.KIND, String.class);
            String roleStr = claims.get(JwtClaims.ROLE, String.class);

            if (sub == null || sub.isBlank() || aid == null || aid.isBlank() || kindStr == null || kindStr.isBlank()) {
                SecurityContextHolder.clearContext();
                chain.doFilter(request, response);
                return;
            }

            UUID accountId;
            try {
                accountId = UUID.fromString(aid);
            } catch (IllegalArgumentException e) {
                SecurityContextHolder.clearContext();
                chain.doFilter(request, response);
                return;
            }

            AccountKind kind;
            try {
                kind = AccountKind.valueOf(kindStr);
            } catch (IllegalArgumentException e) {
                SecurityContextHolder.clearContext();
                chain.doFilter(request, response);
                return;
            }

            Role role = null;
            if (roleStr != null && !roleStr.isBlank()) {
                try {
                    role = Role.valueOf(roleStr);
                } catch (IllegalArgumentException e) {
                    SecurityContextHolder.clearContext();
                    chain.doFilter(request, response);
                    return;
                }
            }

            var authorities = new ArrayList<SimpleGrantedAuthority>();
            if (role != null)
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role.name()));
            authorities.add(new SimpleGrantedAuthority("KIND_" + kind.name()));

            var principal = new AuthPrincipal(accountId, sub, kind, role);
            var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (JwtException ex) {
            SecurityContextHolder.clearContext();
        }

        chain.doFilter(request, response);
    }
}
