package com.bteam.ovs.auth.controller;

import com.bteam.ovs.auth.dto.request.UserLoginRequest;
import com.bteam.ovs.auth.dto.request.UserRegisterRequest;
import com.bteam.ovs.auth.dto.request.VerifyEmailRequest;
import com.bteam.ovs.auth.dto.response.MeDetailResponse;
import com.bteam.ovs.auth.dto.response.MeResponse;
import com.bteam.ovs.auth.dto.response.TokenResponse;
import com.bteam.ovs.auth.service.UserAuthService;
import com.bteam.ovs.shared.security.PrincipalExtractor;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class UserAuthController {

    private final UserAuthService voterAuthService;

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
        UUID accountId = PrincipalExtractor.requireAccountId(authentication);
        return voterAuthService.me(accountId);
    }

    @GetMapping("/me/detail")
    public MeDetailResponse meDetail(Authentication authentication) {
        UUID accountId = PrincipalExtractor.requireAccountId(authentication);
        return voterAuthService.meDetail(accountId);
    }
}
