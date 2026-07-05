package com.bteam.ovs.elections.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.bteam.ovs.elections.entity.ElectionEligibilityRule;
import java.util.List;
import java.util.UUID;

public interface ElectionEligibilityRuleRepository extends JpaRepository<ElectionEligibilityRule, UUID> {

    List<ElectionEligibilityRule> findByElectionId(UUID electionId);

    List<ElectionEligibilityRule> findByCityCode(String cityCode);
}
