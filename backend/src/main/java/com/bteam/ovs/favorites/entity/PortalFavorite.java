package com.bteam.ovs.favorites.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "portal_favorite", uniqueConstraints = @UniqueConstraint(name = "uk_portal_favorite_owner_target", columnNames = {
        "account_id", "target_type", "target_id" }), indexes = {
                @Index(name = "ix_portal_favorite_owner_type_created", columnList = "account_id, target_type, created_at"),
                @Index(name = "ix_portal_favorite_target", columnList = "target_type, target_id")
        })
@EntityListeners(AuditingEntityListener.class)
public class PortalFavorite {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 24)
    private FavoriteTargetType targetType;

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected PortalFavorite() {
    }

    public PortalFavorite(UUID accountId, FavoriteTargetType targetType, UUID targetId) {
        this.accountId = accountId;
        this.targetType = targetType;
        this.targetId = targetId;
    }

    public UUID getId() {
        return id;
    }

    public UUID getAccountId() {
        return accountId;
    }

    public FavoriteTargetType getTargetType() {
        return targetType;
    }

    public UUID getTargetId() {
        return targetId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
