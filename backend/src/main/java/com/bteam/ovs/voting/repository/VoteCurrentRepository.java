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

    /**
     * 通常投票（現在票）集計：
     * - type=CANDIDATE のとき candidateId ごと
     * - type=NONE_SUPPORT のとき candidateId は null で 1グループになる想定
     */
    @Query("""
                select v.type as type, v.candidateId as candidateId, count(v) as cnt
                from #{#entityName} v
                where v.electionId = :electionId
                group by v.type, v.candidateId
            """)
    List<VoteCount> countByElectionGroupByTypeAndCandidate(@Param("electionId") UUID electionId);

    interface VoteCount {
        String getType(); // "CANDIDATE" | "NONE_SUPPORT"

        UUID getCandidateId(); // NONE_SUPPORT の場合 null

        long getCnt();
    }

    List<VoteCurrent> findByCitizenIdAndElectionIdIn(
            UUID citizenId,
            Collection<UUID> electionIds);

    /**
     * 現在票 UPSERT（type + nullable candidateId 対応）
     */
    @Modifying
    @Query(value = """
            insert into vote_current (election_id, citizen_id, type, candidate_id, casted_at)
            values (:electionId, :citizenId, :type, :candidateId, :castedAt)
            on conflict (election_id, citizen_id)
            do update set
                type         = excluded.type,
                candidate_id = excluded.candidate_id,
                casted_at    = excluded.casted_at
            """, nativeQuery = true)
    int upsertCurrent(
            @Param("electionId") UUID electionId,
            @Param("citizenId") UUID citizenId,
            @Param("type") String type,
            @Param("candidateId") UUID candidateId, // ★ nullable を許容
            @Param("castedAt") Instant castedAt);

    // @Query("""
    // select v.candidateId as candidateId, count(v) as cnt
    // from #{#entityName} v
    // where v.electionId = :electionId
    // and v.type = 'CANDIDATE'
    // group by v.candidateId
    // """)
    // List<VoteCount> countByElectionGroupByCandidate(@Param("electionId") UUID
    // electionId);

}
