package com.bteam.ovs.elections.repo;

import com.bteam.ovs.elections.model.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface CandidateRepository extends JpaRepository<Candidate, UUID> {

    int deleteByElectionIdIn(Collection<UUID> electionIds);
    List<Candidate> findByElectionId(UUID electionId);
    boolean existsByIdAndElectionId(UUID id, UUID electionId);
    List<Candidate> findByElectionIdIn(Collection<UUID> electionIds);

    interface ElectionCandidateCount {
        UUID getElectionId();
        long getCnt();
    }

    @Query("""
        select c.electionId as electionId, count(c.id) as cnt
        from Candidate c
        where c.electionId in :electionIds
        group by c.electionId
    """)
    List<ElectionCandidateCount> countByElectionIdIn(@Param("electionIds") Collection<UUID> electionIds);
}
