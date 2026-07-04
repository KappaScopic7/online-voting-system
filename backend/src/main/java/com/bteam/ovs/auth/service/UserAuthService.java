package com.bteam.ovs.auth.service;

import com.bteam.ovs.auth.entity.Role;
import com.bteam.ovs.auth.entity.UserAccount;
import com.bteam.ovs.auth.repository.UserAccountRepository;
import com.bteam.ovs.config.security.JwtService;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.auth.dto.request.UserLoginRequest;
import com.bteam.ovs.auth.dto.request.UserRegisterRequest;
import com.bteam.ovs.auth.dto.response.TokenResponse;
import com.bteam.ovs.auth.entity.AccountKind;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserAuthService {

    private final UserAccountRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserAuthService(UserAccountRepository userRepo, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public void register(UserRegisterRequest req) {
        String email = normalizeEmail(req.email());

        if (userRepo.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED", "このメールアドレスは既に登録済みです");
        }

        var e = new UserAccount();
        e.setEmail(email);
        e.setPasswordHash(passwordEncoder.encode(req.password()));

        e.setRole(Role.USER);
        e.setEmailVerified(false);

        e.setEnabled(true);
        e.setLocked(false);
        e.setCitizenId(null);

        userRepo.save(e);
    }

    @Transactional
    public void verifyEmail(String emailRaw, String codeRaw) {
        String email = normalizeEmail(emailRaw);
        String code = normalize(codeRaw);

        if (email == null || email.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_EMAIL", "emailが不正です");
        }
        if (code == null || code.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CODE", "codeが不正です");
        }

        var acc = userRepo.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ACCOUNT_NOT_FOUND", "アカウントが存在しません"));

        if (!acc.isEnabled())
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "アカウントが無効です");
        if (acc.isLocked())
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", "アカウントがロックされています");

        if (acc.isEmailVerified()) {
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_VERIFIED", "既にメール認証済みです");
        }

        acc.setEmailVerified(true);
        userRepo.save(acc);
    }

    public TokenResponse login(UserLoginRequest req) {
        String email = normalizeEmail(req.email());

        var account = userRepo.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "ACCOUNT_NOT_FOUND", "アカウントが存在しません"));

        if (!account.isEnabled())
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "アカウントが無効です");
        if (account.isLocked())
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", "アカウントがロックされています");

        if (!passwordEncoder.matches(req.password(), account.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "IDまたはパスワードが違います");
        }

        if (!account.isEmailVerified()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED", "メール認証が完了していません");
        }

        String token = jwtService.issueAccessToken(
                account.getId(),
                account.getEmail(),
                account.getRole(),
                AccountKind.USER);

        return new TokenResponse(
                token,
                "Bearer",
                jwtService.expiresInSeconds(),
                account.getRole() == null ? null : account.getRole().name());
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String normalize(String s) {
        return s == null ? null : s.trim();
    }
}
