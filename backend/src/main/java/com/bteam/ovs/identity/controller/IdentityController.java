package com.bteam.ovs.identity.controller;

import com.bteam.ovs.auth.controller.dto.TokenResponse;
import com.bteam.ovs.auth.entity.AccountKind;
import com.bteam.ovs.config.security.JwtService;
import com.bteam.ovs.identity.controller.dto.IdentityLinkByNfcRequest;
import com.bteam.ovs.identity.service.IdentityLinkService;
import com.bteam.ovs.identity.service.NfcResolveService;
import com.bteam.ovs.shared.security.PrincipalExtractor;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/identity")
public class IdentityController {

    private final IdentityLinkService identityLinkService;
    private final NfcResolveService nfcResolveService;
    private final JwtService jwtService;

    public IdentityController(
            IdentityLinkService identityLinkService,
            NfcResolveService nfcResolveService,
            JwtService jwtService) {
        this.identityLinkService = identityLinkService;
        this.nfcResolveService = nfcResolveService;
        this.jwtService = jwtService;
    }

    /**
     * 恒久本人認証（PIN＋タッチ必須）
     */
    @PostMapping("/link")
    public TokenResponse link(
            @Valid @RequestBody IdentityLinkByNfcRequest req,
            Authentication auth) {

        UUID accountId = PrincipalExtractor.requireAccountId(auth);

        // 🔐 サーバ側で PIN＋NFC を検証
        var resolved = nfcResolveService.resolve(req.payload(), req.pin());

        UUID citizenId = UUID.fromString(resolved.citizenId());

        var linked = identityLinkService.link(accountId, citizenId);

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
