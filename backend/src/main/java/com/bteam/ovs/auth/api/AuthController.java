package com.bteam.ovs.auth.api;

import com.bteam.ovs.auth.api.dto.*;
import com.bteam.ovs.auth.application.VoterAuthService;
import com.bteam.ovs.auth.infra.jpa.PortalAccountJpaRepository;
import com.bteam.ovs.common.errors.ApiException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final VoterAuthService voterAuthService;
    private final PortalAccountJpaRepository portalRepo;

    public AuthController(VoterAuthService voterAuthService, PortalAccountJpaRepository portalRepo) {
        this.voterAuthService = voterAuthService;
        this.portalRepo = portalRepo;
    }

    @PostMapping("/voter/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void voterRegister(@Valid @RequestBody VoterRegisterRequest req) {
        voterAuthService.register(req);
    }

    @PostMapping("/voter/login")
    public TokenResponse voterLogin(@Valid @RequestBody VoterLoginRequest req) {
        return voterAuthService.login(req);
    }

    @GetMapping("/me")
    public MeResponse me(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }
        String email = authentication.getName();

        var acc = portalRepo.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        return new MeResponse(
                acc.getId(),
                acc.getEmail(),
                acc.getRole().name(),
                acc.isEmailVerified(),
                acc.getCitizenId() != null
        );
    }
}
