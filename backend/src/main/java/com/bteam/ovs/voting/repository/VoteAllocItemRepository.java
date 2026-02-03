package com.bteam.ovs.voting.repository;

import com.bteam.ovs.voting.entity.VoteAllocItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;
import java.util.Collection;

public interface VoteAllocItemRepository extends JpaRepository<VoteAllocItem, UUID> {

    List<VoteAllocItem> findByCastIdIn(Collection<UUID> castIds);

    interface PointSum {
        UUID getCandidateId();

        Long getPts();
    }

    @Query("""
                select i.candidateId as candidateId, sum(i.points) as pts
                from VoteAllocItem i
                where i.targetType = com.bteam.ovs.voting.entity.VoteAllocItem.TargetType.CANDIDATE
                  and exists (
                      select 1
                      from VoteAllocCast c
                      where c.id = i.castId
                        and c.electionId = :electionId
                  )
                group by i.candidateId
            """)
    List<PointSum> sumPointsByElectionGroupByCandidate(UUID electionId);

    @Query("""
                select coalesce(sum(i.points), 0)
                from VoteAllocItem i
                where i.targetType = com.bteam.ovs.voting.entity.VoteAllocItem.TargetType.NONE_SUPPORT
                  and exists (
                      select 1
                      from VoteAllocCast c
                      where c.id = i.castId
                        and c.electionId = :electionId
                  )
            """)
    long sumNoneSupportPointsByElection(UUID electionId);
}
