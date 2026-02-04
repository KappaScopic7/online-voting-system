package com.bteam.ovs.voting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.bteam.ovs.voting.entity.VoteCurrent;
import com.bteam.ovs.voting.entity.VoteCurrentKey;

import java.time.Instant;
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
            Collection<UUID> electionIds);

    @Modifying
    @Query(value = """
            insert into vote_current (election_id, citizen_id, candidate_id, casted_at)
            values (:electionId, :citizenId, :candidateId, :castedAt)
            on conflict (election_id, citizen_id)
            do update set
                candidate_id = excluded.candidate_id,
                casted_at    = excluded.casted_at
            """, nativeQuery = true)
    int upsertCurrent(
            @Param("electionId") UUID electionId,
            @Param("citizenId") UUID citizenId,
            @Param("candidateId") UUID candidateId,
            @Param("castedAt") Instant castedAt);
}
