package com.bteam.ovs.voting.repository;

import com.bteam.ovs.voting.entity.VoteAllocCurrent;
import com.bteam.ovs.voting.entity.VoteAllocCurrentKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface VoteAllocCurrentRepository extends JpaRepository<VoteAllocCurrent, VoteAllocCurrentKey> {

    Optional<VoteAllocCurrent> findByElectionIdAndCitizenId(UUID electionId, UUID citizenId);

    boolean existsByElectionIdAndCitizenId(UUID electionId, UUID citizenId);
}
