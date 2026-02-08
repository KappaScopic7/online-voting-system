package com.bteam.ovs.config.security;

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

import java.io.IOException;
import java.util.List;
import java.util.UUID;

public class VoteTokenAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public VoteTokenAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String p = request.getRequestURI();
        // public voting 系にだけ投票トークンを適用（alloc 公開も将来やるならここに含める）
        return !(p.startsWith("/api/public/voting/") || p.startsWith("/api/public/alloc-voting/"));
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {

        // すでに認証済みなら何もしない
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            chain.doFilter(request, response);
            return;
        }

        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.regionMatches(true, 0, "Bearer ", 0, 7)) {
            chain.doFilter(request, response);
            return;
        }

        String token = auth.substring(7).trim();
        if (token.isEmpty()) {
            chain.doFilter(request, response);
            return;
        }

        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(jwtService.key())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String kind = String.valueOf(claims.get(JwtClaims.KIND));
            if (!"VOTE".equals(kind)) {
                chain.doFilter(request, response);
                return;
            }

            // token は election 専用（必須）
            String eidStr = String.valueOf(claims.get("eid"));
            UUID tokenElectionId = UUID.fromString(eidStr);

            // subject = citizenId（必須）
            UUID citizenId = UUID.fromString(claims.getSubject());

            // principal を VotePrincipal にする（PrincipalExtractor.requireVotePrincipal と整合）
            var principal = new VotePrincipal(citizenId, tokenElectionId);

            var authentication = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    List.of(new SimpleGrantedAuthority("KIND_VOTE")));
            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (JwtException | IllegalArgumentException e) {
            SecurityContextHolder.clearContext();
        }

        chain.doFilter(request, response);
    }
}
