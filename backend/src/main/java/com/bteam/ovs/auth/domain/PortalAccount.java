package com.bteam.ovs.auth.domain;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public class PortalAccount {
    private final UUID id;
    private final String email;
    private final String passwordHash;

    private final Role role; // 常にVOTER運用でも良いが、拡張性のため保持
    private final boolean emailVerified;
    private final boolean enabled;
    private final boolean locked;

    // 案A：本人認証後に citizenId が入る（未認証は null）
    private final UUID citizenId;

    private final Instant createdAt;
    private final Instant updatedAt;

    public PortalAccount(
            UUID id,
            String email,
            String passwordHash,
            Role role,
            boolean emailVerified,
            boolean enabled,
            boolean locked,
            UUID citizenId,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = Objects.requireNonNull(id);
        this.email = Objects.requireNonNull(email);
        this.passwordHash = Objects.requireNonNull(passwordHash);
        this.role = Objects.requireNonNull(role);
        this.emailVerified = emailVerified;
        this.enabled = enabled;
        this.locked = locked;
        this.citizenId = citizenId;
        this.createdAt = Objects.requireNonNull(createdAt);
        this.updatedAt = Objects.requireNonNull(updatedAt);
    }

    public UUID id() { return id; }
    public String email() { return email; }
    public String passwordHash() { return passwordHash; }
    public Role role() { return role; }

    public boolean emailVerified() { return emailVerified; }
    public boolean enabled() { return enabled; }
    public boolean locked() { return locked; }

    public UUID citizenId() { return citizenId; }
    public boolean isIdentityLinked() { return citizenId != null; } // 投票可否の核

    public Instant createdAt() { return createdAt; }
    public Instant updatedAt() { return updatedAt; }
}
