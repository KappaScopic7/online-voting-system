package com.bteam.ovs.voting.repo;

import com.bteam.ovs.voting.model.VoteCurrent;
import com.bteam.ovs.voting.model.VoteCurrentKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VoteCurrentRepository extends JpaRepository<VoteCurrent, VoteCurrentKey> {

    Optional<VoteCurrent> findByElectionIdAndCitizenId(UUID electionId, UUID citizenId);

    boolean existsByElectionIdAndCitizenId(UUID electionId, UUID citizenId);

    @Query("""
        select v.candidateId as candidateId, count(v) as cnt
        from #{#entityName} v
        where v.electionId = :electionId
        group by v.candidateId
    """)
    List<VoteCount> countByElectionGroupByCandidate(@Param("electionId") UUID electionId);

    interface VoteCount {
        UUID getCandidateId();
        long getCnt();
    }

    List<VoteCurrent> findByCitizenIdAndElectionIdIn(
            UUID citizenId,
            Collection<UUID> electionIds
    );
}
