package com.bteam.ovs.auth.web;

import com.bteam.ovs.auth.service.CommitteeAuthService;
import com.bteam.ovs.auth.web.dto.CommitteeLoginRequest;
import com.bteam.ovs.auth.web.dto.TokenResponse;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    private final CommitteeAuthService committeeAuthService;

    public AdminAuthController(CommitteeAuthService committeeAuthService) {
        this.committeeAuthService = committeeAuthService;
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody CommitteeLoginRequest req) {
        return committeeAuthService.login(req);
    }
}
