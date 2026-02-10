package com.bteam.ovs.voting.repository;

import com.bteam.ovs.voting.entity.JudgeReviewItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JudgeReviewItemRepository extends JpaRepository<JudgeReviewItem, UUID> {
    void deleteByCastId(UUID castId);

    List<JudgeReviewItem> findByCastId(UUID castId);
}
