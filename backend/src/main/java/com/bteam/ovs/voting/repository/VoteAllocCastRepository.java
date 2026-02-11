package com.bteam.ovs.voting.repository;

import com.bteam.ovs.voting.entity.VoteAllocCast;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VoteAllocCastRepository extends JpaRepository<VoteAllocCast, UUID> {

    Optional<VoteAllocCast> findByElectionIdAndCitizenId(UUID electionId, UUID citizenId);

    List<VoteAllocCast> findByCitizenIdAndElectionIdIn(UUID citizenId, Collection<UUID> electionIds);

    boolean existsByElectionIdAndCitizenId(UUID electionId, UUID citizenId);

    // ★ AllocationVotingService が使ってる
    List<VoteAllocCast> findByCitizenIdOrderByCastedAtDesc(UUID citizenId);
}
