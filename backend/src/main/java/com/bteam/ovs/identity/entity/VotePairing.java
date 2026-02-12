package com.bteam.ovs.identity.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
public class VotePairing {

    public enum Status {
        PENDING, COMPLETED, EXPIRED
    }

    @Id
    @Column(nullable = false, updatable = false)
    private UUID pairId;

    @Column(nullable = false, updatable = false)
    private UUID electionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(length = 512)
    private String ticket;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false, updatable = false)
    private Instant expiresAt;

    protected VotePairing() {
    }

    public VotePairing(UUID pairId, UUID electionId, Instant createdAt, Instant expiresAt) {
        this.pairId = pairId;
        this.electionId = electionId;
        this.status = Status.PENDING;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    public UUID getPairId() {
        return pairId;
    }

    public UUID getElectionId() {
        return electionId;
    }

    public Status getStatus() {
        return status;
    }

    public String getTicket() {
        return ticket;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void complete(String ticket) {
        this.ticket = ticket;
        this.status = Status.COMPLETED;
    }

    public void expireIfNeeded(Instant now) {
        if (this.status == Status.PENDING && now.isAfter(this.expiresAt)) {
            this.status = Status.EXPIRED;
        }
    }
}
