package com.bteam.ovs.voter.repository;

import com.bteam.ovs.election.domain.Election;
import com.bteam.ovs.voter.domain.VoterAccount;
import com.bteam.ovs.voter.domain.VoterElectionIdentity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VoterElectionIdentityRepository extends JpaRepository<VoterElectionIdentity, Long> {
    boolean existsByVoterAccountAndElection(VoterAccount voterAccount, Election election);
    Optional<VoterElectionIdentity> findByVoterAccountAndElection(VoterAccount voterAccount, Election election);
}
