package com.bteam.ovs.auth.security;

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
import java.util.List;
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

            String role = claims.get("role", String.class);
            String aid = claims.get("aid", String.class);
            String kind = claims.get("kind", String.class);

            var authorities = (role == null)
                ? List.<SimpleGrantedAuthority>of()
                : List.of(new SimpleGrantedAuthority("ROLE_" + role));

            var authentication = new UsernamePasswordAuthenticationToken(aid, null, authorities);
            authentication.setDetails(Map.of("kind", kind, "sub", claims.getSubject()));
            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (JwtException ex) {
            SecurityContextHolder.clearContext();
        }

        chain.doFilter(request, response);
    }
}
