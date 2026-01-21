package com.bteam.ovs.auth.web;

import com.bteam.ovs.auth.model.IdentityStatus;
import com.bteam.ovs.auth.repo.UserAccountRepository;
import com.bteam.ovs.auth.service.UserAuthService;
import com.bteam.ovs.auth.web.dto.*;
import com.bteam.ovs.shared.errors.ApiException;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class UserAuthController {

    private final UserAuthService voterAuthService;
    private final UserAccountRepository userRepo;

    public UserAuthController(UserAuthService voterAuthService, UserAccountRepository userRepo) {
        this.voterAuthService = voterAuthService;
        this.userRepo = userRepo;
    }

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

        var identityStatus = (acc.getCitizenId() == null)
                ? IdentityStatus.NONE
                : IdentityStatus.LINKED;

        return new MeResponse(
                acc.getId(),
                acc.getEmail(),
                acc.getRole() == null ? null : acc.getRole().name(),
                acc.isEmailVerified(),
                identityStatus
        );
    }

    @GetMapping("/me/detail")
    public MeDetailResponse meDetail(Authentication authentication) {
        var acc = findMe(authentication);

        var identityStatus = (acc.getCitizenId() == null)
                ? IdentityStatus.NONE
                : IdentityStatus.LINKED;

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
                acc.getUpdatedAt()
        );
    }

    private com.bteam.ovs.auth.model.UserAccount findMe(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }

        UUID accountId;
        try {
            @SuppressWarnings("unchecked")
            var details = (Map<String, Object>) authentication.getDetails();
            accountId = UUID.fromString((String) details.get("aid"));
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }

        return userRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));
    }
}
