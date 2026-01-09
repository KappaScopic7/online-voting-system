package com.bteam.ovs.auth.web;

import com.bteam.ovs.auth.repo.UserAccountRepository;
import com.bteam.ovs.auth.service.VoterAuthService;
import com.bteam.ovs.auth.web.dto.*;
import com.bteam.ovs.shared.errors.ApiException;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final VoterAuthService voterAuthService;
    private final UserAccountRepository userRepo;

    public AuthController(VoterAuthService voterAuthService, UserAccountRepository userRepo) {
        this.voterAuthService = voterAuthService;
        this.userRepo = userRepo;
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

        UUID accountId;
        try {
            accountId = UUID.fromString(authentication.getName()); // principal=aid(UUID文字列)
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }

        var acc = userRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        return new MeResponse(
            acc.getId(),
            acc.getEmail(),
            acc.getRole() == null ? null : acc.getRole().name(),
            acc.isEmailVerified(),
            acc.getCitizenId() != null
        );
    }
}
