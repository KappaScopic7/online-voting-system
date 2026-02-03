package com.bteam.ovs.voting.repository;

import com.bteam.ovs.voting.entity.VoteAllocItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface VoteAllocItemRepository extends JpaRepository<VoteAllocItem, UUID> {

    List<VoteAllocItem> findByCastId(UUID castId);

    interface PointSum {
        UUID getCandidateId();

        Long getPts();
    }

    @Query("""
                select i.candidateId as candidateId, sum(i.points) as pts
                from VoteAllocItem i
                join VoteAllocCast c on c.id = i.castId
                where c.electionId = :electionId
                  and i.targetType = com.bteam.ovs.voting.entity.VoteAllocItem.TargetType.CANDIDATE
                group by i.candidateId
            """)
    List<PointSum> sumPointsByElectionGroupByCandidate(UUID electionId);

    @Query("""
                select coalesce(sum(i.points), 0)
                from VoteAllocItem i
                join VoteAllocCast c on c.id = i.castId
                where c.electionId = :electionId
                  and i.targetType = com.bteam.ovs.voting.entity.VoteAllocItem.TargetType.NONE_SUPPORT
            """)
    long sumNoneSupportPointsByElection(UUID electionId);
}
