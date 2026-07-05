package com.bteam.ovs.eligibility.service;

import com.bteam.ovs.citizen.repository.CitizenRepository;
import com.bteam.ovs.eligibility.entity.EligibilitySnapshot;
import com.bteam.ovs.profile.repository.VoterProfileSelfRepository;
import com.bteam.ovs.shared.auth.AccountResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class EligibilityProfileResolver {

    private final AccountResolver accountResolver;
    private final CitizenRepository citizenRepo;
    private final VoterProfileSelfRepository selfRepo;

    @Transactional(readOnly = true)
    public EligibilitySnapshot resolve(UUID accountId) {
        var acc = accountResolver.requireActiveAccount(accountId);

        // 本人認証済み -> citizen優先
        if (acc.getCitizenId() != null) {
            var c = citizenRepo.findById(acc.getCitizenId()).orElse(null);
            if (c == null)
                return EligibilitySnapshot.none();
            return new EligibilitySnapshot(
                    EligibilitySnapshot.Source.CITIZEN,
                    c.getBirthDate(),
                    c.getPrefCode(),
                    c.getCityCode());
        }

        // 未本人認証 -> 自己申告
        var p = selfRepo.findById(accountId).orElse(null);
        if (p == null)
            return EligibilitySnapshot.none();

        return new EligibilitySnapshot(
                EligibilitySnapshot.Source.SELF,
                p.getBirthDate(),
                p.getPrefCode(),
                p.getCityCode());
    }

    @Transactional(readOnly = true)
    public EligibilitySnapshot resolveCitizen(UUID citizenId) {
        var c = citizenRepo.findById(citizenId).orElse(null);
        if (c == null)
            return EligibilitySnapshot.none();

        return new EligibilitySnapshot(
                EligibilitySnapshot.Source.CITIZEN,
                c.getBirthDate(),
                c.getPrefCode(),
                c.getCityCode());
    }
}
