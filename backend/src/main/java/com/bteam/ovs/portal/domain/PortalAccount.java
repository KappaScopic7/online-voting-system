package com.bteam.ovs.portal.domain;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.*;

@Entity
@Table(
    name = "portal_account",
    indexes = {
        @Index(name = "ix_portal_account_email", columnList = "email")
    }
)
public class PortalAccount {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 200)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PortalAccountStatus status;

    private Instant emailVerifiedAt;

    // UC_08: 委員会の有権者データと紐付け
    // DBで UNIQUE を張る（nullは複数可）
    @Column(unique = true)
    private Long linkedVoterId;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        var now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = Instant.now();
    }

    // getter/setter（必要分だけ）
    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public PortalAccountStatus getStatus() { return status; }
    public void setStatus(PortalAccountStatus status) { this.status = status; }
    public Instant getEmailVerifiedAt() { return emailVerifiedAt; }
    public void setEmailVerifiedAt(Instant emailVerifiedAt) { this.emailVerifiedAt = emailVerifiedAt; }
    public Long getLinkedVoterId() { return linkedVoterId; }
    public void setLinkedVoterId(Long linkedVoterId) { this.linkedVoterId = linkedVoterId; }
}
