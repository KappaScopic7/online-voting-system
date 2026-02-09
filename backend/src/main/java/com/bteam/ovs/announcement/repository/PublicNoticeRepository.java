package com.bteam.ovs.announcement.repository;

import com.bteam.ovs.announcement.entity.PublicNotice;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface PublicNoticeRepository extends JpaRepository<PublicNotice, UUID> {

    @Query("""
                select n from PublicNotice n
                where n.publishedAt <= :now
                  and (n.expiresAt is null or n.expiresAt > :now)
                order by n.pinned desc, n.publishedAt desc
            """)
    List<PublicNotice> findActiveForPublic(Instant now, Pageable pageable);

    @Query("""
                select n from PublicNotice n
                order by n.pinned desc, n.publishedAt desc
            """)
    List<PublicNotice> findAllForCommittee(Pageable pageable);
}
