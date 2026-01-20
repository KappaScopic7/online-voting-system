package com.bteam.ovs.auth.web;

import com.bteam.ovs.auth.model.StaffAccount;
import com.bteam.ovs.auth.repo.StaffAccountRepository;
import com.bteam.ovs.auth.service.StaffAuthService;
import com.bteam.ovs.auth.web.dto.StaffLoginRequest;
import com.bteam.ovs.auth.web.dto.StaffMeResponse;
import com.bteam.ovs.auth.web.dto.TokenResponse;
import com.bteam.ovs.shared.errors.ApiException;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/staff/auth")
public class StaffAuthController {

    private final StaffAuthService staffAuthService;
    private final StaffAccountRepository staffRepo;

    public StaffAuthController(
            StaffAuthService staffAuthService,
            StaffAccountRepository StaffRepo
    ) {
        this.staffAuthService = staffAuthService;
        this.staffRepo = StaffRepo;
    }

    /**
     * staff login
     */
    @PostMapping("/login")
    public TokenResponse staffLogin(
            @Valid @RequestBody StaffLoginRequest req
    ) {
        return staffAuthService.login(req);
    }

    /**
     * staff me
     */
    @GetMapping("/me")
    public StaffMeResponse me(Authentication authentication) {
        var acc = findMe(authentication);

        // staff ロールチェック（二重防御）
        if (acc.getRole() == null ||
            !(acc.getRole().name().equals("ADMIN")
           || acc.getRole().name().equals("COMMITTEE"))) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "FORBIDDEN",
                    "スタッフ権限がありません"
            );
        }

        return new StaffMeResponse(
                acc.getId(),
                acc.getLoginId(),
                acc.getRole(),
                acc.isEnabled(),
                acc.isLocked()
        );
    }

    // =========================
    // 共通処理
    // =========================

    private StaffAccount findMe(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "UNAUTHORIZED",
                    "未ログインです"
            );
        }

        UUID accountId;
        try {
            @SuppressWarnings("unchecked")
            var details = (Map<String, Object>) authentication.getDetails();
            accountId = UUID.fromString((String) details.get("aid"));
        } catch (Exception ex) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "UNAUTHORIZED",
                    "未ログインです"
            );
        }

        return staffRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED,
                        "UNAUTHORIZED",
                        "未ログインです"
                ));
    }
}
