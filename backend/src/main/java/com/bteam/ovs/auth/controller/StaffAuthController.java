package com.bteam.ovs.auth.controller;

import com.bteam.ovs.auth.controller.dto.MeDetailResponse;
import com.bteam.ovs.auth.controller.dto.StaffLoginRequest;
import com.bteam.ovs.auth.controller.dto.StaffMeResponse;
import com.bteam.ovs.auth.controller.dto.TokenResponse;
import com.bteam.ovs.auth.entity.IdentityStatus;
import com.bteam.ovs.auth.entity.StaffAccount;
import com.bteam.ovs.auth.repository.StaffAccountRepository;
import com.bteam.ovs.auth.service.StaffAuthService;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.shared.security.PrincipalExtractor;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/staff/auth")
public class StaffAuthController {

    private final StaffAuthService staffAuthService;
    private final StaffAccountRepository staffRepo;

    public StaffAuthController(StaffAuthService staffAuthService, StaffAccountRepository staffRepo) {
        this.staffAuthService = staffAuthService;
        this.staffRepo = staffRepo;
    }

    @PostMapping("/login")
    public TokenResponse staffLogin(@Valid @RequestBody StaffLoginRequest req) {
        return staffAuthService.login(req);
    }

    @GetMapping("/me")
    public StaffMeResponse me(Authentication authentication) {
        var acc = findMe(authentication);
        return new StaffMeResponse(acc.getId(), acc.getLoginId(), acc.getRole(), acc.isEnabled(), acc.isLocked());
    }

//    @GetMapping("/me/detail")
//    public MeDetailResponse meDetail(Authentication authentication) {
//        var acc = findMe(authentication);
//        var identityStatus = (acc.getCitizenId() == null) ? IdentityStatus.NONE : IdentityStatus.LINKED;

//        return new MeDetailResponse(
//                acc.getId(),
//                acc.getEmail(),
//                acc.getRole() == null ? null : acc.getRole().name(),
//                acc.isEmailVerified(),
//                acc.isEnabled(),
//                acc.isLocked(),
//                acc.getCitizenId(),
//                identityStatus,
//                acc.getCreatedAt(),
//                acc.getUpdatedAt());
//    }

    private StaffAccount findMe(Authentication authentication) {
        UUID accountId = PrincipalExtractor.requireAccountId(authentication);

        return staffRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));
    }
}