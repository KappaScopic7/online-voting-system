package com.bteam.ovs.identity.service;

import com.bteam.ovs.auth.entity.Role;
import com.bteam.ovs.auth.repository.UserAccountRepository;
import com.bteam.ovs.citizen.repository.CitizenRepository;
import com.bteam.ovs.shared.errors.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class IdentityLinkService {

    public record LinkedAccount(UUID accountId, String email, Role role) {
    }

    private final UserAccountRepository userRepo;
    private final CitizenRepository citizenRepo;

    @Transactional
    public LinkedAccount link(UUID accountId, UUID citizenId) {
        var acc = userRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (!acc.isEnabled())
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "アカウントが無効です");
        if (acc.isLocked())
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", "アカウントがロックされています");

        if (!acc.isEmailVerified()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED", "メール認証が完了していません");
        }

        if (!citizenRepo.existsById(citizenId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CITIZEN_NOT_FOUND", "指定されたcitizenIdは存在しません");
        }
        if (acc.getCitizenId() != null) {
            if (citizenId.equals(acc.getCitizenId())) {
                return new LinkedAccount(acc.getId(), acc.getEmail(), acc.getRole());
            }
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_LINKED", "すでに本人認証済みです");
        }

        acc.setCitizenId(citizenId);
        acc.setRole(Role.VOTER);

        userRepo.save(acc);

        return new LinkedAccount(acc.getId(), acc.getEmail(), acc.getRole());
    }
}
