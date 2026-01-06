package com.bteam.ovs.auth.application;

import com.bteam.ovs.auth.infra.jpa.PortalAccountJpaRepository;
import com.bteam.ovs.common.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class VoterEligibilityService {

    private final PortalAccountJpaRepository portalRepo;

    public VoterEligibilityService(PortalAccountJpaRepository portalRepo) {
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
