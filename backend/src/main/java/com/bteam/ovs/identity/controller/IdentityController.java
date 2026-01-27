package com.bteam.ovs.identity.controller;

import com.bteam.ovs.auth.controller.dto.TokenResponse;
import com.bteam.ovs.auth.entity.AccountKind;
import com.bteam.ovs.config.security.JwtService;
import com.bteam.ovs.identity.controller.dto.IdentityLinkRequest;
import com.bteam.ovs.identity.service.IdentityLinkService;
import com.bteam.ovs.shared.security.PrincipalExtractor;
import static com.bteam.ovs.shared.validation.UuidParsers.parseOr400;

import jakarta.validation.Valid;
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
        UUID accountId = PrincipalExtractor.requireAccountId(auth);

        UUID citizenId = parseOr400(req.citizenId(), "INVALID_CITIZEN_ID", "citizenIdが不正です");
        // ★ DB更新（citizenIdセット & role=VOTER）
        var linked = identityLinkService.link(accountId, citizenId);

        // ★ 新しいJWTを返す（role=VOTERがclaimに入る）
        String token = jwtService.issueAccessToken(
                linked.accountId(),
                linked.email(),
                linked.role(),
                AccountKind.USER);

        return new TokenResponse(
                token,
                "Bearer",
                jwtService.expiresInSeconds(),
                linked.role() == null ? null : linked.role().name());
    }
}
