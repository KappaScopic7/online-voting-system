package com.bteam.ovs.voting.repository;

import com.bteam.ovs.voting.entity.VoteAllocCast;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface VoteAllocCastRepository extends JpaRepository<VoteAllocCast, UUID> {
    List<VoteAllocCast> findByCitizenIdOrderByCastedAtDesc(UUID citizenId);

    Optional<VoteAllocCast> findByElectionIdAndCitizenId(UUID electionId, UUID citizenId);

}
