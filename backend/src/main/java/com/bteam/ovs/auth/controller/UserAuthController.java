package com.bteam.ovs.auth.controller;

import com.bteam.ovs.auth.dto.request.UserLoginRequest;
import com.bteam.ovs.auth.dto.request.UserRegisterRequest;
import com.bteam.ovs.auth.dto.request.VerifyEmailRequest;
import com.bteam.ovs.auth.dto.response.MeDetailResponse;
import com.bteam.ovs.auth.dto.response.MeResponse;
import com.bteam.ovs.auth.dto.response.TokenResponse;
import com.bteam.ovs.auth.entity.IdentityStatus;
import com.bteam.ovs.auth.repository.UserAccountRepository;
import com.bteam.ovs.auth.service.UserAuthService;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.shared.security.PrincipalExtractor;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@AllArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class UserAuthController {

    private final UserAuthService voterAuthService;
    private final UserAccountRepository userRepo;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void voterRegister(@Valid @RequestBody UserRegisterRequest req) {
        voterAuthService.register(req);
    }

    @PostMapping("/verify")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void verify(@Valid @RequestBody VerifyEmailRequest req) {
        voterAuthService.verifyEmail(req.email(), req.code());
    }

    @PostMapping("/login")
    public TokenResponse voterLogin(@Valid @RequestBody UserLoginRequest req) {
        return voterAuthService.login(req);
    }

    @GetMapping("/me")
    public MeResponse me(Authentication authentication) {
        var acc = findMe(authentication);
        var identityStatus = (acc.getCitizenId() == null) ? IdentityStatus.NONE : IdentityStatus.LINKED;

        return new MeResponse(
                acc.getId(),
                acc.getEmail(),
                acc.getRole() == null ? null : acc.getRole().name(),
                acc.isEmailVerified(),
                identityStatus);
    }

    @GetMapping("/me/detail")
    public MeDetailResponse meDetail(Authentication authentication) {
        var acc = findMe(authentication);
        var identityStatus = (acc.getCitizenId() == null) ? IdentityStatus.NONE : IdentityStatus.LINKED;

        return new MeDetailResponse(
                acc.getId(),
                acc.getEmail(),
                acc.getRole() == null ? null : acc.getRole().name(),
                acc.isEmailVerified(),
                acc.isEnabled(),
                acc.isLocked(),
                acc.getCitizenId(),
                identityStatus,
                acc.getCreatedAt(),
                acc.getUpdatedAt());
    }

    private com.bteam.ovs.auth.entity.UserAccount findMe(Authentication authentication) {
        UUID accountId = PrincipalExtractor.requireAccountId(authentication);

        return userRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));
    }
}
