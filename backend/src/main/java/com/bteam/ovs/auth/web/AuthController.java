package com.bteam.ovs.auth.web;

import com.bteam.ovs.auth.repo.PortalAccountRepository;
import com.bteam.ovs.auth.service.VoterAuthService;
import com.bteam.ovs.auth.web.dto.*;
import com.bteam.ovs.shared.errors.ApiException;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final VoterAuthService voterAuthService;
    private final PortalAccountRepository portalRepo;

    public AuthController(VoterAuthService voterAuthService, PortalAccountRepository portalRepo) {
        this.voterAuthService = voterAuthService;
        this.portalRepo = portalRepo;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void voterRegister(@Valid @RequestBody VoterRegisterRequest req) {
        voterAuthService.register(req);
    }

    @PostMapping("/login")
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
