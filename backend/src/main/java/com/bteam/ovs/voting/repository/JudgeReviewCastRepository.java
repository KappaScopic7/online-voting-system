package com.bteam.ovs.voting.repository;

import com.bteam.ovs.voting.entity.JudgeReviewCast;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface JudgeReviewCastRepository extends JpaRepository<JudgeReviewCast, UUID> {
    Optional<JudgeReviewCast> findByElectionIdAndCitizenId(UUID electionId, UUID citizenId);
}
