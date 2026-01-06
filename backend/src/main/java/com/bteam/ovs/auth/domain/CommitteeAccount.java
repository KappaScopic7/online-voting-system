package com.bteam.ovs.auth.domain;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public class CommitteeAccount {
    private final UUID id;
    private final String loginId;      // メールでも社員IDでもOK。まずはloginIdに逃がす
    private final String passwordHash;

    private final Role role;           // COMMITTEE or ADMIN
    private final boolean enabled;
    private final boolean locked;

    private final Instant createdAt;
    private final Instant updatedAt;

    public CommitteeAccount(
            UUID id,
            String loginId,
            String passwordHash,
            Role role,
            boolean enabled,
            boolean locked,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = Objects.requireNonNull(id);
        this.loginId = Objects.requireNonNull(loginId);
        this.passwordHash = Objects.requireNonNull(passwordHash);
        this.role = Objects.requireNonNull(role);
        this.enabled = enabled;
        this.locked = locked;
        this.createdAt = Objects.requireNonNull(createdAt);
        this.updatedAt = Objects.requireNonNull(updatedAt);
    }

    public UUID id() { return id; }
    public String loginId() { return loginId; }
    public String passwordHash() { return passwordHash; }
    public Role role() { return role; }
    public boolean enabled() { return enabled; }
    public boolean locked() { return locked; }
    public Instant createdAt() { return createdAt; }
    public Instant updatedAt() { return updatedAt; }
}
