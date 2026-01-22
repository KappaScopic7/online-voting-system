package com.bteam.ovs.identity.service;

import com.bteam.ovs.auth.model.Role;
import com.bteam.ovs.auth.repo.UserAccountRepository;
import com.bteam.ovs.citizen.repo.CitizenRepository;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class IdentityLinkService {

    public record LinkedAccount(UUID accountId, String email, Role role) {}

    private final UserAccountRepository userRepo;
    private final CitizenRepository citizenRepo; // ★追加

    public IdentityLinkService(UserAccountRepository userRepo, CitizenRepository citizenRepo) { // ★変更
        this.userRepo = userRepo;
        this.citizenRepo = citizenRepo;
    }

    @Transactional
    public LinkedAccount link(UUID accountId, UUID citizenId) {
        var acc = userRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (!acc.isEnabled()) throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "アカウントが無効です");
        if (acc.isLocked()) throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", "アカウントがロックされています");

        if (!acc.isEmailVerified()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED", "メール認証が完了していません");
        }

        // ★ citizenId 実在チェック（スタブ市民マスタ）
        if (!citizenRepo.existsById(citizenId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CITIZEN_NOT_FOUND", "指定されたcitizenIdは存在しません");
        }

        // （任意）すでにリンク済みなら弾く/上書き許可、どっちでもOK
        // if (acc.getCitizenId() != null) { ... }

        acc.setCitizenId(citizenId);
        acc.setRole(Role.VOTER);

        userRepo.save(acc);

        return new LinkedAccount(acc.getId(), acc.getEmail(), acc.getRole());
    }
}
