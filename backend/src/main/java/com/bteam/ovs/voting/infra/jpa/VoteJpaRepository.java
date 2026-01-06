package com.bteam.ovs.voting.infra.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface VoteJpaRepository extends JpaRepository<VoteEntity, UUID> {
    Optional<VoteEntity> findByElectionIdAndCitizenId(UUID electionId, UUID citizenId);
}
