package com.bteam.ovs.identity.web;

import com.bteam.ovs.auth.security.JwtService;
import com.bteam.ovs.auth.web.dto.TokenResponse;
import com.bteam.ovs.identity.service.IdentityLinkService;
import com.bteam.ovs.identity.web.dto.IdentityLinkRequest;
import com.bteam.ovs.shared.errors.ApiException;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/identity")
public class IdentityController {

    private final IdentityLinkService identityLinkService;
    private final JwtService jwtService;

    public IdentityController(IdentityLinkService identityLinkService, JwtService jwtService) {
        this.identityLinkService = identityLinkService;
        this.jwtService = jwtService;
    }

    @PostMapping("/link")
    public TokenResponse link(@Valid @RequestBody IdentityLinkRequest req, Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }

        UUID accountId;
        try {
            accountId = UUID.fromString(auth.getName()); // principal=aid(UUID文字列)
        } catch (Exception e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }

        UUID citizenId;
        try {
            citizenId = UUID.fromString(req.citizenId());
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CITIZEN_ID", "citizenIdが不正です");
        }

        // ★ DB更新（citizenIdセット & role=VOTER）
        var linked = identityLinkService.link(accountId, citizenId);

        // ★ 新しいJWTを返す（role=VOTERがclaimに入る）
        String token = jwtService.issueAccessToken(
                linked.accountId(),
                linked.email(),
                linked.role(), // Role.VOTER（想定）
                JwtService.AccountKind.USER
        );

        return new TokenResponse(
                token,
                "Bearer",
                jwtService.expiresInSeconds(),
                linked.role() == null ? null : linked.role().name()
        );
    }
}
