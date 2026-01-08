package com.bteam.ovs.identity.web;

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
public class VoterIdentityController {

    private final IdentityLinkService identityLinkService;

    public VoterIdentityController(IdentityLinkService identityLinkService) {
        this.identityLinkService = identityLinkService;
    }

    @PostMapping("/link")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void link(@Valid @RequestBody IdentityLinkRequest req, Authentication auth) {
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

        identityLinkService.link(accountId, citizenId);
    }
}
