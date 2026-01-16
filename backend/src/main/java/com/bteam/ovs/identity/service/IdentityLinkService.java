package com.bteam.ovs.identity.service;

import com.bteam.ovs.auth.model.Role;
import com.bteam.ovs.auth.repo.UserAccountRepository;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class IdentityLinkService {

    public record LinkedAccount(UUID accountId, String email, Role role) {}

    private final UserAccountRepository userRepo;

    public IdentityLinkService(UserAccountRepository userRepo) {
        this.userRepo = userRepo;
    }

    @Transactional
    public LinkedAccount link(UUID accountId, UUID citizenId) {
        var acc = userRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (!acc.isEnabled()) throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "アカウントが無効です");
        if (acc.isLocked()) throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", "アカウントがロックされています");

        // ★ メール認証が先
        if (!acc.isEmailVerified()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED", "メール認証が完了していません");
        }

        // citizenId 保存
        acc.setCitizenId(citizenId);

        // ★ 本人認証で VOTER 昇格
        acc.setRole(Role.VOTER);

        userRepo.save(acc);

        return new LinkedAccount(acc.getId(), acc.getEmail(), acc.getRole());
    }
}
