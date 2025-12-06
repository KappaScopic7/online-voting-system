package com.bteam.ovs.vote.repository;

import com.bteam.ovs.election.domain.Candidate;
import com.bteam.ovs.election.domain.Election;
import com.bteam.ovs.election.domain.ElectionStatus;
import com.bteam.ovs.vote.domain.Vote;
import com.bteam.ovs.vote.domain.VoteStatus;
import com.bteam.ovs.voter.domain.VoterAccount;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
