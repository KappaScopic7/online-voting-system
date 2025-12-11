package com.bteam.ovs.vote.repository;

import com.bteam.ovs.election.domain.Candidate;
import com.bteam.ovs.election.domain.Election;
import com.bteam.ovs.election.domain.ElectionStatus;
import com.bteam.ovs.election.dto.ElectionResultItem;
import com.bteam.ovs.vote.domain.Vote;
import com.bteam.ovs.vote.domain.VoteStatus;
import com.bteam.ovs.voter.domain.VoterAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VoteRepository extends JpaRepository<Vote, Long> {

    List<Vote> findByVoterAccountAndElectionAndStatus(
            VoterAccount voterAccount,
            Election election,
            VoteStatus status
    );

    Optional<Vote> findTopByVoterAccountAndElectionAndStatusOrderByVotedAtDesc(
            VoterAccount voterAccount,
            Election election,
            VoteStatus status
    );

    long countByElectionAndCandidateAndStatus(
            Election election,
            Candidate candidate,
            VoteStatus status
    );

    boolean existsByElection_Status(ElectionStatus status);

    @Query("""
        select new com.bteam.ovs.election.dto.ElectionResultItem(
            c.id,
            c.name,
            c.partyName,
            count(v)
        )
        from Candidate c
        left join Vote v
        on v.candidate = c
        and v.status = :status
        where c.election.id = :electionId
        group by c.id, c.name, c.partyName, c.displayOrder
        order by c.displayOrder asc, c.id asc
        """)
    List<ElectionResultItem> aggregateElectionResult(
            @Param("electionId") Long electionId,
            @Param("status") VoteStatus status
    );

    List<Vote> findByVoterAccountOrderByVotedAtDesc(VoterAccount voterAccount);
}
