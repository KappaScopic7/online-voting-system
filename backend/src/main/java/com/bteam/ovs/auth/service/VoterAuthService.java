package com.bteam.ovs.auth.service;

import com.bteam.ovs.auth.repo.PortalAccountRepository;
import com.bteam.ovs.auth.model.PortalAccount;
import com.bteam.ovs.auth.model.Role;
import com.bteam.ovs.auth.security.JwtService;
import com.bteam.ovs.auth.web.dto.TokenResponse;
import com.bteam.ovs.auth.web.dto.VoterLoginRequest;
import com.bteam.ovs.auth.web.dto.VoterRegisterRequest;
import com.bteam.ovs.shared.errors.ApiException;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class VoterAuthService {

    private final PortalAccountRepository portalRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public VoterAuthService(PortalAccountRepository portalRepo, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.portalRepo = portalRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public void register(VoterRegisterRequest req) {
        String email = normalizeEmail(req.email());

        if (portalRepo.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED", "このメールアドレスは既に登録済みです");
        }

        var e = new PortalAccount();
        e.setEmail(email);
        e.setPasswordHash(passwordEncoder.encode(req.password()));
        e.setRole(Role.VOTER);
        e.setEmailVerified(false); // UC_02未実装なので false のまま
        e.setEnabled(true);
        e.setLocked(false);
        e.setCitizenId(null);
        e.setCreatedAt(Instant.now());
        e.setUpdatedAt(Instant.now());

        portalRepo.save(e);

        // (UC_02): 認証メール送信（token発行→メール→verify API）
    }

    public TokenResponse login(VoterLoginRequest req) {
        String email = normalizeEmail(req.email());

        var account = portalRepo.findByEmail(email)
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

        String token = jwtService.issueAccessToken(account.getId(), account.getEmail(), account.getRole());
        return new TokenResponse(token, "Bearer", jwtService.expiresInSeconds(), account.getRole().name());
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
