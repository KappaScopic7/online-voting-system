package com.bteam.ovs.elections.repo;

import com.bteam.ovs.elections.model.ElectionEligibilityRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ElectionEligibilityRuleRepository extends JpaRepository<ElectionEligibilityRule, UUID> {

    List<ElectionEligibilityRule> findByElectionId(UUID electionId);

    // MyElections 計算で使う想定：住所(cityCode)が一致する候補ルールを引く
    List<ElectionEligibilityRule> findByCityCode(String cityCode);
}
