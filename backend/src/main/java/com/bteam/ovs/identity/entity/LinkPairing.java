package com.bteam.ovs.identity.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
public class LinkPairing {

    public enum Status {
        PENDING, COMPLETED, EXPIRED
    }

    @Id
    @Column(nullable = false, updatable = false)
    private UUID pairId;

    @Column(nullable = false, updatable = false)
    private UUID accountId; // ログイン中ユーザー

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false, updatable = false)
    private Instant expiresAt;

    protected LinkPairing() {
    }

    public LinkPairing(UUID pairId, UUID accountId, Instant createdAt, Instant expiresAt) {
        this.pairId = pairId;
        this.accountId = accountId;
        this.status = Status.PENDING;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    public UUID getPairId() {
        return pairId;
    }

    public UUID getAccountId() {
        return accountId;
    }

    public Status getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void complete() {
        this.status = Status.COMPLETED;
    }

    public void expireIfNeeded(Instant now) {
        if (this.status == Status.PENDING && now.isAfter(this.expiresAt)) {
            this.status = Status.EXPIRED;
        }
    }
}
