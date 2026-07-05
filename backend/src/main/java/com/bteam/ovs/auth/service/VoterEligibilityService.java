package com.bteam.ovs.auth.service;

import com.bteam.ovs.auth.repository.UserAccountRepository;
import com.bteam.ovs.shared.errors.ApiException;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;

@RequiredArgsConstructor
@Service
public class VoterEligibilityService {

    private final UserAccountRepository userRepo;

    public void assertIdentityLinked(UUID accountId) {
        var acc = userRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (acc.getCitizenId() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "IDENTITY_NOT_LINKED", "本人認証が完了していません");
        }
    }
}
