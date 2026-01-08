package com.bteam.ovs.identity.service;

import com.bteam.ovs.auth.repo.PortalAccountRepository;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class IdentityLinkService {

    private final PortalAccountRepository portalRepo;

    public IdentityLinkService(PortalAccountRepository portalRepo) {
        this.portalRepo = portalRepo;
    }

    @Transactional
    public void link(UUID accountId, UUID citizenId) {
        var acc = portalRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (acc.getCitizenId() != null) {
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_LINKED", "既に本人認証済みです");
        }

        acc.setCitizenId(citizenId);
        portalRepo.save(acc);
    }
}
