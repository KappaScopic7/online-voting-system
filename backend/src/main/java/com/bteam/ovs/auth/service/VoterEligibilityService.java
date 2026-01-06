package com.bteam.ovs.auth.service;

import com.bteam.ovs.auth.repo.PortalAccountRepository;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class VoterEligibilityService {

    private final PortalAccountRepository portalRepo;

    public VoterEligibilityService(PortalAccountRepository portalRepo) {
        this.portalRepo = portalRepo;
    }

    public void assertIdentityLinked(String email) {
        var acc = portalRepo.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (acc.getCitizenId() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "IDENTITY_NOT_LINKED", "本人認証が完了していません");
        }
    }
}
