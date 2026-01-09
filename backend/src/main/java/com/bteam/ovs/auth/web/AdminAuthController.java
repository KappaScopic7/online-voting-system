package com.bteam.ovs.auth.web;

import com.bteam.ovs.auth.service.StaffAuthService;
import com.bteam.ovs.auth.web.dto.StaffLoginRequest;
import com.bteam.ovs.auth.web.dto.TokenResponse;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    private final StaffAuthService staffAuthService;

    public AdminAuthController(StaffAuthService staffAuthService) {
        this.staffAuthService = staffAuthService;
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody StaffLoginRequest req) {
        return staffAuthService.login(req);
    }
}
