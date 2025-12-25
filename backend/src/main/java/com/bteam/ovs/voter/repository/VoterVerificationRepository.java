package com.bteam.ovs.voter.repository;

import com.bteam.ovs.election.domain.Election;
import com.bteam.ovs.voter.domain.VoterAccount;
import com.bteam.ovs.voter.domain.VoterVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VoterVerificationRepository extends JpaRepository<VoterVerification, Long> {
    Optional<VoterVerification> findByVoterAccountAndElection(VoterAccount voterAccount, Election election);
    boolean existsByVoterAccountAndElectionAndVerifiedTrue(VoterAccount voterAccount, Election election);
}
