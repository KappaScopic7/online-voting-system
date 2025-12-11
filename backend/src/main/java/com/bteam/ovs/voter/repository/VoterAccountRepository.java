package com.bteam.ovs.voter.repository;

import com.bteam.ovs.citizen.domain.Citizen;
import com.bteam.ovs.voter.domain.VoterAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VoterAccountRepository extends JpaRepository<VoterAccount, Long> {

    Optional<VoterAccount> findByCitizen(Citizen citizen);

    Optional<VoterAccount> findByEmail(String email);

    Optional<VoterAccount> findByCitizen_PseudoMyNumber(String pseudoMyNumber);

    boolean existsByEmail(String email);
}
