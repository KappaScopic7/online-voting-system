package com.bteam.ovs.config.security;

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
import java.util.Map;

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

            String sub  = claims.getSubject();          // principal にする（email / loginId）
            String role = claims.get("role", String.class);
            String aid  = claims.get("aid", String.class);
            String kind = claims.get("kind", String.class);

            // principal が空なら無効（運用上の事故防止）
            if (sub == null || sub.isBlank()) {
                SecurityContextHolder.clearContext();
                chain.doFilter(request, response);
                return;
            }

            var authorities = new ArrayList<SimpleGrantedAuthority>();

            // ROLE_*
            if (role != null && !role.isBlank()) {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
            }

            // KIND_*（USER / STAFF）
            if (kind != null && !kind.isBlank()) {
                authorities.add(new SimpleGrantedAuthority("KIND_" + kind));
            }

            var authentication =
                    new UsernamePasswordAuthenticationToken(sub, null, authorities);

            // details に aid/kind を残す（必要なら Controller で参照できる）
            authentication.setDetails(Map.of(
                    "aid", aid,
                    "kind", kind
            ));

            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (JwtException ex) {
            // 署名不正/期限切れ/形式不正 → 認証なしとして扱う
            SecurityContextHolder.clearContext();
        }

        chain.doFilter(request, response);
    }
}
