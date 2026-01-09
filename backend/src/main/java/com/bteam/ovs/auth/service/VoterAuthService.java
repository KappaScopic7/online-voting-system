package com.bteam.ovs.auth.service;

import com.bteam.ovs.auth.repo.UserAccountRepository;
import com.bteam.ovs.auth.model.UserAccount;
import com.bteam.ovs.auth.security.JwtService;
import com.bteam.ovs.auth.web.dto.TokenResponse;
import com.bteam.ovs.auth.web.dto.VoterLoginRequest;
import com.bteam.ovs.auth.web.dto.VoterRegisterRequest;
import com.bteam.ovs.shared.errors.ApiException;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class VoterAuthService {

    private final UserAccountRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public VoterAuthService(UserAccountRepository userRepo, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public void register(VoterRegisterRequest req) {
        String email = normalizeEmail(req.email());

        if (userRepo.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED", "このメールアドレスは既に登録済みです");
        }

        var e = new UserAccount();
        e.setEmail(email);
        e.setPasswordHash(passwordEncoder.encode(req.password()));
        e.setRole(null);
        e.setEmailVerified(false);
        e.setEnabled(true);
        e.setLocked(false);
        e.setCitizenId(null);

        userRepo.save(e);
    }

    public TokenResponse login(VoterLoginRequest req) {
        String email = normalizeEmail(req.email());

        var account = userRepo.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "ACCOUNT_NOT_FOUND", "アカウントが存在しません"));

        if (!account.isEnabled()) throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "アカウントが無効です");
        if (account.isLocked()) throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", "アカウントがロックされています");

        if (!passwordEncoder.matches(req.password(), account.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "IDまたはパスワードが違います");
        }

        String token = jwtService.issueAccessToken(
                account.getId(),
                account.getEmail(),
                account.getRole(),
                JwtService.AccountKind.USER
        );

        return new TokenResponse(
                token,
                "Bearer",
                jwtService.expiresInSeconds(),
                account.getRole() == null ? null : account.getRole().name() // ★ null対応
        );
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
