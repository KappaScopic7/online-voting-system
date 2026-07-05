package com.bteam.ovs.auth.service;

import com.bteam.ovs.auth.entity.Role;
import com.bteam.ovs.auth.entity.UserAccount;
import com.bteam.ovs.auth.repository.UserAccountRepository;
import com.bteam.ovs.config.security.JwtService;
import com.bteam.ovs.shared.errors.ApiException;

import lombok.RequiredArgsConstructor;

import com.bteam.ovs.auth.dto.request.UserLoginRequest;
import com.bteam.ovs.auth.dto.request.UserRegisterRequest;
import com.bteam.ovs.auth.dto.response.MeDetailResponse;
import com.bteam.ovs.auth.dto.response.MeResponse;
import com.bteam.ovs.auth.dto.response.TokenResponse;
import com.bteam.ovs.auth.entity.AccountKind;
import com.bteam.ovs.auth.entity.IdentityStatus;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
public class UserAuthService {

    private final UserAccountRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

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

    public MeResponse me(UUID accountId) {
        var acc = findByIdOrUnauthorized(accountId);
        var identityStatus = (acc.getCitizenId() == null)
                ? IdentityStatus.NONE
                : IdentityStatus.LINKED;

        return new MeResponse(
                acc.getId(),
                acc.getEmail(),
                acc.getRole() == null ? null : acc.getRole().name(),
                acc.isEmailVerified(),
                identityStatus);
    }

    public MeDetailResponse meDetail(UUID accountId) {
        var acc = findByIdOrUnauthorized(accountId);
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
                acc.getUpdatedAt());
    }

    private UserAccount findByIdOrUnauthorized(UUID accountId) {
        return userRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));
    }

}
