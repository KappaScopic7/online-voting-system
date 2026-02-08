package com.bteam.ovs.voting.repository;

import com.bteam.ovs.voting.entity.VoteAllocItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface VoteAllocItemRepository extends JpaRepository<VoteAllocItem, UUID> {

    List<VoteAllocItem> findByCastIdIn(Collection<UUID> castIds);

    interface PointSum {
        UUID getCandidateId();

        Long getPts();
    }

    @Query("""
              select i.candidateId as candidateId, sum(i.points) as pts
              from VoteAllocItem i, VoteAllocCast c
              where c.id = i.castId
                and c.electionId = :electionId
                and i.targetType = com.bteam.ovs.voting.entity.VoteAllocItem.TargetType.CANDIDATE
              group by i.candidateId
            """)
    List<PointSum> sumPointsByElectionGroupByCandidate(@Param("electionId") UUID electionId);

    @Query("""
              select coalesce(sum(i.points), 0)
              from VoteAllocItem i, VoteAllocCast c
              where c.id = i.castId
                and c.electionId = :electionId
                and i.targetType = com.bteam.ovs.voting.entity.VoteAllocItem.TargetType.NONE_SUPPORT
            """)
    Long sumNoneSupportPointsByElection(@Param("electionId") UUID electionId);

    @Modifying
    @Transactional
    void deleteByCastId(UUID castId);
}
