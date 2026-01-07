package com.bteam.ovs.elections.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bteam.ovs.elections.model.Candidate;

import java.util.List;
import java.util.UUID;

public interface CandidateRepository extends JpaRepository<Candidate, UUID> {
    List<Candidate> findByElectionId(UUID electionId);
    boolean existsByIdAndElectionId(UUID id, UUID electionId);
}
