package com.bteam.ovs.favorites.repository;

import com.bteam.ovs.favorites.entity.FavoriteTargetType;
import com.bteam.ovs.favorites.entity.PortalFavorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface PortalFavoriteRepository extends JpaRepository<PortalFavorite, UUID> {

    boolean existsByAccountIdAndTargetTypeAndTargetId(UUID accountId, FavoriteTargetType targetType, UUID targetId);

    long deleteByAccountIdAndTargetTypeAndTargetId(UUID accountId, FavoriteTargetType targetType, UUID targetId);

    Page<PortalFavorite> findByAccountIdAndTargetTypeOrderByCreatedAtDesc(
            UUID accountId, FavoriteTargetType targetType, Pageable pageable);

    Page<PortalFavorite> findByAccountIdOrderByCreatedAtDesc(UUID accountId, Pageable pageable);

    List<PortalFavorite> findByAccountIdAndTargetTypeAndTargetIdIn(
            UUID accountId, FavoriteTargetType targetType, Collection<UUID> targetIds);

    List<PortalFavorite> findByAccountIdOrderByCreatedAtDesc(UUID accountId);

}
