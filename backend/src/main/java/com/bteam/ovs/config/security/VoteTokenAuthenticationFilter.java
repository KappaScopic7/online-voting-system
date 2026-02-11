// backend/src/main/java/com/bteam/ovs/config/security/VoteTokenAuthenticationFilter.java
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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

public class VoteTokenAuthenticationFilter extends OncePerRequestFilter {

    public static final String ATTR_VOTE_TOKEN_ELECTION_ID = "voteTokenElectionId";

    private final JwtService jwtService;

    public VoteTokenAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // public 投票系エンドポイントに適用
        String path = request.getRequestURI();
        return !(path.startsWith("/api/public/voting/") ||
                path.startsWith("/api/public/alloc-voting/") ||
                path.startsWith("/api/public/judge-review/"));
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
            UUID citizenId = UUID.fromString(claims.getSubject());
            UUID tokenElectionId = null;

            if ("VOTE".equals(kind)) {
                String eidStr = String.valueOf(claims.get("eid"));
                tokenElectionId = UUID.fromString(eidStr);

                // （VOTE のときだけ）electionId一致チェック
                String reqElectionId = request.getParameter("electionId");
                if (reqElectionId != null && !reqElectionId.isBlank()) {
                    UUID reqEid = UUID.fromString(reqElectionId);
                    if (!tokenElectionId.equals(reqEid)) {
                        SecurityContextHolder.clearContext();
                        chain.doFilter(request, response);
                        return;
                    }
                }
            } else if ("PUBLIC".equals(kind)) {
                // election縛り無し
                tokenElectionId = null;
            } else {
                chain.doFilter(request, response);
                return;
            }

            if (tokenElectionId != null) {
                request.setAttribute(ATTR_VOTE_TOKEN_ELECTION_ID, tokenElectionId);
            }

            VotePrincipal vp = new VotePrincipal(citizenId, tokenElectionId);
            var authentication = new UsernamePasswordAuthenticationToken(
                    vp, null, List.of());
            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (JwtException | IllegalArgumentException e) {
            SecurityContextHolder.clearContext();
        }

        chain.doFilter(request, response);
    }
}
