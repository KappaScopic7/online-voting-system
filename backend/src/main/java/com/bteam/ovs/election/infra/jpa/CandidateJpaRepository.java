package com.bteam.ovs.election.infra.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CandidateJpaRepository extends JpaRepository<CandidateEntity, UUID> {
    List<CandidateEntity> findByElectionId(UUID electionId);
    boolean existsByIdAndElectionId(UUID id, UUID electionId);
}
