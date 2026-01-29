// backend/src/main/java/com/bteam/ovs/elections/service/ElectionEligibilityService.java
package com.bteam.ovs.elections.service;

import com.bteam.ovs.eligibility.service.EligibilityProfileResolver;
import com.bteam.ovs.eligibility.service.entity.EligibilitySnapshot;
import com.bteam.ovs.elections.repository.ElectionEligibilityRuleRepository;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.UUID;

@Service
public class ElectionEligibilityService {

    private final EligibilityProfileResolver resolver;
    private final ElectionEligibilityRuleRepository ruleRepo;

    public ElectionEligibilityService(
            EligibilityProfileResolver resolver,
            ElectionEligibilityRuleRepository ruleRepo) {
        this.resolver = resolver;
        this.ruleRepo = ruleRepo;
    }

    /**
     * My選挙一覧（MyElectionsService）と同一ロジックで、
     * 指定 electionId に対して投票資格が無ければ 403 を投げる。
     */
    @Transactional(readOnly = true)
    public void requireEligible(UUID accountId, UUID electionId) {
        EligibilitySnapshot snap = resolver.resolve(accountId);

        // MyElectionsService と同等：情報が無ければ対象外
        if (snap.source() == EligibilitySnapshot.Source.NONE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_ELIGIBLE", "投票資格情報がありません");
        }
        if (snap.cityCode() == null || snap.cityCode().isBlank()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_ELIGIBLE", "住所情報(cityCode)がありません");
        }

        Integer age = calcAge(snap.birthDate(), LocalDate.now());

        // MyElectionsService と同等：住所(cityCode)で候補ルール取得
        var rules = ruleRepo.findByCityCode(snap.cityCode());

        // 「この electionId に該当するルールが存在し、かつ minAge を満たす」ことを要求
        boolean ok = rules.stream()
                .anyMatch(r -> electionId.equals(r.getElectionId()) && passesMinAge(age, r.getMinAge()));

        if (!ok) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_ELIGIBLE", "この選挙の投票資格がありません");
        }
    }

    private Integer calcAge(LocalDate birthDate, LocalDate today) {
        if (birthDate == null)
            return null;
        try {
            return Period.between(birthDate, today).getYears();
        } catch (Exception e) {
            return null;
        }
    }

    private boolean passesMinAge(Integer age, Integer minAge) {
        if (minAge == null)
            return true; // 条件なし
        if (age == null)
            return false; // 年齢不明なら条件を満たせない
        return age >= minAge;
    }
}
