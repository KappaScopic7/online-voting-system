package com.bteam.ovs.voting.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bteam.ovs.voting.model.Vote;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VoteRepository extends JpaRepository<Vote, UUID> {
    Optional<Vote> findByElectionIdAndCitizenId(UUID electionId, UUID citizenId);

    List<Vote> findByCitizenIdOrderByCastedAtDesc(UUID citizenId);
}
