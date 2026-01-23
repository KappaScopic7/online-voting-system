package com.bteam.ovs.elections.service;

import com.bteam.ovs.eligibility.service.EligibilityProfileResolver;
import com.bteam.ovs.elections.entity.Election;
import com.bteam.ovs.elections.repository.ElectionEligibilityRuleRepository;
import com.bteam.ovs.elections.repository.ElectionRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.*;

@Service
public class MyElectionsService {

    private final EligibilityProfileResolver resolver;
    private final ElectionEligibilityRuleRepository ruleRepo;
    private final ElectionRepository electionRepo;

    public MyElectionsService(
            EligibilityProfileResolver resolver,
            ElectionEligibilityRuleRepository ruleRepo,
            ElectionRepository electionRepo
    ) {
        this.resolver = resolver;
        this.ruleRepo = ruleRepo;
        this.electionRepo = electionRepo;
    }

    @Transactional(readOnly = true)
    public List<Election> listMyElections(UUID accountId) {
        var snap = resolver.resolve(accountId);

        if (snap.source() == com.bteam.ovs.eligibility.service.entity.EligibilitySnapshot.Source.NONE) {
            return List.of();
        }
        if (snap.cityCode() == null || snap.cityCode().isBlank()) {
            return List.of();
        }

        Integer age = calcAge(snap.birthDate(), LocalDate.now());

        // まず住所(cityCode)で候補ルールを引く
        var rules = ruleRepo.findByCityCode(snap.cityCode());

        // 年齢条件でさらに絞り、該当 electionId を集める
        Set<UUID> electionIds = new HashSet<>();
        for (var r : rules) {
            if (r.getElectionId() == null) continue;
            if (!passesMinAge(age, r.getMinAge())) continue;
            electionIds.add(r.getElectionId());
        }

        if (electionIds.isEmpty()) return List.of();

        // election をまとめて引く
        // 戻り順はDB次第なので、必要なら並べ替える
        var found = electionRepo.findAllById(electionIds);

        // 例：startsAt昇順（好みで）
        found.sort(Comparator.comparing(Election::getStartsAt, Comparator.nullsLast(Comparator.naturalOrder())));
        return found;
    }

    private Integer calcAge(LocalDate birthDate, LocalDate today) {
        if (birthDate == null) return null;
        try {
            return Period.between(birthDate, today).getYears();
        } catch (Exception e) {
            return null;
        }
    }

    private boolean passesMinAge(Integer age, Integer minAge) {
        if (minAge == null) return true;   // 条件なし
        if (age == null) return false;     // 年齢不明なら条件を満たせない
        return age >= minAge;
    }
}
