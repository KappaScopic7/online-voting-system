package com.bteam.ovs.auth.service;

import com.bteam.ovs.auth.repo.CommitteeAccountRepository;
import com.bteam.ovs.auth.security.JwtService;
import com.bteam.ovs.auth.security.JwtService.AccountKind;
import com.bteam.ovs.auth.web.dto.CommitteeLoginRequest;
import com.bteam.ovs.auth.web.dto.TokenResponse;
import com.bteam.ovs.shared.errors.ApiException;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class CommitteeAuthService {

    private final CommitteeAccountRepository committeeRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public CommitteeAuthService(
            CommitteeAccountRepository committeeRepo,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.committeeRepo = committeeRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public TokenResponse login(CommitteeLoginRequest req) {
        String loginId = normalize(req.loginId());

        var account = committeeRepo.findByLoginId(loginId)
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

        String token = jwtService.issueAccessToken(account.getId(), account.getLoginId(), account.getRole(), AccountKind.COMMITTEE);
        return new TokenResponse(token, "Bearer", jwtService.expiresInSeconds(), account.getRole().name());
    }

    private String normalize(String s) {
        return s == null ? null : s.trim();
    }
}
