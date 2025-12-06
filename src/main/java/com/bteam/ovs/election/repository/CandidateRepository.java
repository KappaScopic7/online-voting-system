package com.bteam.ovs.election.repository;

import com.bteam.ovs.election.domain.Candidate;
import com.bteam.ovs.election.domain.Election;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CandidateRepository extends JpaRepository<Candidate, Long> {

    List<Candidate> findByElectionOrderByDisplayOrderAsc(Election election);

    // ★ 追加：特定選挙の候補者数を数える
    long countByElection(Election election);
}
