package com.bteam.ovs.identity.service;

import com.bteam.ovs.auth.repo.UserAccountRepository;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class IdentityLinkService {

    private final UserAccountRepository userRepo;

    public IdentityLinkService(UserAccountRepository userRepo) {
        this.userRepo = userRepo;
    }

    @Transactional
    public void link(UUID accountId, UUID citizenId) {
        var acc = userRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (acc.getCitizenId() != null) {
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_LINKED", "既に本人認証済みです");
        }

        acc.setCitizenId(citizenId);
        userRepo.save(acc);
    }
}
