package com.bteam.ovs.auth.service;

import com.bteam.ovs.auth.repository.StaffAccountRepository;
import com.bteam.ovs.config.security.JwtService;
import com.bteam.ovs.auth.dto.request.StaffLoginRequest;
import com.bteam.ovs.auth.dto.response.TokenResponse;
import com.bteam.ovs.auth.entity.AccountKind;
import com.bteam.ovs.shared.errors.ApiException;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class StaffAuthService {

    private final StaffAccountRepository staffRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public StaffAuthService(
            StaffAccountRepository staffRepo,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.staffRepo = staffRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public TokenResponse login(StaffLoginRequest req) {
        String loginId = normalize(req.loginId());

        var account = staffRepo.findByLoginId(loginId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "ACCOUNT_NOT_FOUND", "アカウントが存在しません"));

        if (!account.isEnabled()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "アカウントが無効です");
        }
        if (account.isLocked()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", "アカウントがロックされています");
        }

        if (!passwordEncoder.matches(req.password(), account.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "IDまたはパスワードが違います");
        }

        String token = jwtService.issueAccessToken(account.getId(), account.getLoginId(), account.getRole(),
                AccountKind.STAFF);
        return new TokenResponse(token, "Bearer", jwtService.expiresInSeconds(), account.getRole().name());
    }

    private String normalize(String s) {
        return s == null ? null : s.trim();
    }
}
