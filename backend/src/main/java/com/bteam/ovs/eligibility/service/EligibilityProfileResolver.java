package com.bteam.ovs.eligibility.service;

import com.bteam.ovs.auth.repo.UserAccountRepository;
import com.bteam.ovs.citizen.repo.CitizenRepository;
import com.bteam.ovs.eligibility.service.model.EligibilitySnapshot;
import com.bteam.ovs.profile.repo.VoterProfileSelfRepository;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class EligibilityProfileResolver {

    private final UserAccountRepository userRepo;
    private final CitizenRepository citizenRepo;
    private final VoterProfileSelfRepository selfRepo;

    public EligibilityProfileResolver(
            UserAccountRepository userRepo,
            CitizenRepository citizenRepo,
            VoterProfileSelfRepository selfRepo
    ) {
        this.userRepo = userRepo;
        this.citizenRepo = citizenRepo;
        this.selfRepo = selfRepo;
    }

    @Transactional(readOnly = true)
    public EligibilitySnapshot resolve(UUID accountId) {
        var acc = userRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (!acc.isEnabled()) throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "アカウントが無効です");
        if (acc.isLocked()) throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", "アカウントがロックされています");

        // 本人認証済み -> citizen優先
        if (acc.getCitizenId() != null) {
            var c = citizenRepo.findById(acc.getCitizenId()).orElse(null);
            if (c == null) return EligibilitySnapshot.none(); // スタブが消えた等の不整合（デモなら基本起きない）
            return new EligibilitySnapshot(
                    EligibilitySnapshot.Source.CITIZEN,
                    c.getBirthDate(),
                    c.getPrefCode(),
                    c.getCityCode()
            );
        }

        // 未本人認証 -> 自己申告
        var p = selfRepo.findById(accountId).orElse(null);
        if (p == null) return EligibilitySnapshot.none();

        return new EligibilitySnapshot(
                EligibilitySnapshot.Source.SELF,
                p.getBirthDate(),
                p.getPrefCode(),
                p.getCityCode()
        );
    }
}
