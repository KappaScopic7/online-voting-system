package com.bteam.ovs.identity.api;

import com.bteam.ovs.auth.infra.jpa.PortalAccountJpaRepository;
import com.bteam.ovs.common.errors.ApiException;
import com.bteam.ovs.identity.api.dto.IdentityLinkRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/voter/identity")
public class VoterIdentityController {

    private final PortalAccountJpaRepository portalRepo;

    public VoterIdentityController(PortalAccountJpaRepository portalRepo) {
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
