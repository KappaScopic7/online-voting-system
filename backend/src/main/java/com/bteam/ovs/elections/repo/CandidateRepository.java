package com.bteam.ovs.elections.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bteam.ovs.elections.model.CandidateEntity;

import java.util.List;
import java.util.UUID;

public interface CandidateRepository extends JpaRepository<CandidateEntity, UUID> {
    List<CandidateEntity> findByElectionId(UUID electionId);
    boolean existsByIdAndElectionId(UUID id, UUID electionId);
}
