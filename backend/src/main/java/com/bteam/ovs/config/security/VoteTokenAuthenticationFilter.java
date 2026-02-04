// backend/src/main/java/com/bteam/ovs/config/security/VoteTokenAuthenticationFilter.java
package com.bteam.ovs.config.security;

import com.bteam.ovs.shared.security.JwtClaims;
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

    /** Controller 側で参照する attribute 名 */
    public static final String ATTR_VOTE_TOKEN_ELECTION_ID = "voteTokenElectionId";

    private final JwtService jwtService;

    public VoteTokenAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/public/voting/");
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
            if (!"VOTE".equals(kind)) {
                chain.doFilter(request, response);
                return;
            }

            // ---- electionId チェック（トークンは選挙専用）----
            String eidStr = String.valueOf(claims.get("eid"));
            UUID tokenElectionId = UUID.fromString(eidStr);

            // start は queryParam で electionId が来るので、ここで一致確認できる
            String reqElectionId = request.getParameter("electionId");
            if (reqElectionId != null && !reqElectionId.isBlank()) {
                UUID reqEid = UUID.fromString(reqElectionId);
                if (!tokenElectionId.equals(reqEid)) {
                    SecurityContextHolder.clearContext();
                    chain.doFilter(request, response);
                    return;
                }
            }

            // Controller で confirm(body) 側も照合できるように attribute に入れておく
            request.setAttribute(ATTR_VOTE_TOKEN_ELECTION_ID, tokenElectionId);

            UUID citizenId = UUID.fromString(claims.getSubject());

            var authentication = new UsernamePasswordAuthenticationToken(
                    citizenId,
                    null,
                    List.of());
            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (JwtException | IllegalArgumentException e) {
            SecurityContextHolder.clearContext();
        }

        chain.doFilter(request, response);
    }
}
