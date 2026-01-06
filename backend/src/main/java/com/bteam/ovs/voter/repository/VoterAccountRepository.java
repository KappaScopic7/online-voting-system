package com.bteam.ovs.voter.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bteam.ovs.voter.domain.VoterAccount;

public interface VoterAccountRepository extends JpaRepository<VoterAccount, UUID> {
    Optional<VoterAccount> findByVoterId(Long voterId);
}
