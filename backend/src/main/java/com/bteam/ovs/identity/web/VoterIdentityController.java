package com.bteam.ovs.identity.web;

import com.bteam.ovs.auth.repo.PortalAccountRepository;
import com.bteam.ovs.identity.web.dto.IdentityLinkRequest;
import com.bteam.ovs.shared.errors.ApiException;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/voter/identity")
public class VoterIdentityController {

    private final PortalAccountRepository portalRepo;

    public VoterIdentityController(PortalAccountRepository portalRepo) {
        this.portalRepo = portalRepo;
    }

    @PostMapping("/link")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void link(@Valid @RequestBody IdentityLinkRequest req, Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }

        var acc = portalRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        // 既にリンク済みなら衝突
        if (acc.getCitizenId() != null) {
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_LINKED", "既に本人認証済みです");
        }

        UUID citizenId;
        try {
            citizenId = UUID.fromString(req.citizenId());
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CITIZEN_ID", "citizenIdが不正です");
        }

        acc.setCitizenId(citizenId);
        portalRepo.save(acc);
    }
}
