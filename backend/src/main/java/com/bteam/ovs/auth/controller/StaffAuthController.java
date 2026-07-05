package com.bteam.ovs.auth.controller;

import com.bteam.ovs.auth.dto.request.StaffLoginRequest;
import com.bteam.ovs.auth.dto.response.StaffMeResponse;
import com.bteam.ovs.auth.dto.response.TokenResponse;
import com.bteam.ovs.auth.service.StaffAuthService;
import com.bteam.ovs.shared.security.PrincipalExtractor;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@AllArgsConstructor
@RestController
@RequestMapping("/api/staff/auth")
public class StaffAuthController {

    private final StaffAuthService staffAuthService;

    @PostMapping("/login")
    public TokenResponse staffLogin(@Valid @RequestBody StaffLoginRequest req) {
        return staffAuthService.login(req);
    }

    @GetMapping("/me")
    public StaffMeResponse me(Authentication authentication) {
        UUID accountId = PrincipalExtractor.requireAccountId(authentication);
        return staffAuthService.me(accountId);
    }
}