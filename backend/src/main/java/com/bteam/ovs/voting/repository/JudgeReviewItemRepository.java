package com.bteam.ovs.voting.repository;

import com.bteam.ovs.voting.entity.JudgeReviewItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface JudgeReviewItemRepository extends JpaRepository<JudgeReviewItem, UUID> {

    List<JudgeReviewItem> findByCastId(UUID castId);

    List<JudgeReviewItem> findByCastIdIn(Collection<UUID> castIds);

    // ★派生deleteじゃなく、DBへ直で delete を投げる（確実）
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("delete from JudgeReviewItem i where i.castId = :castId")
    int deleteByCastId(@Param("castId") UUID castId);
}
