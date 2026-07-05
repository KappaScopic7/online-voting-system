package com.bteam.ovs.auth.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "staff_account", uniqueConstraints = {
        @UniqueConstraint(name = "uk_staff_account_login_id", columnNames = { "login_id" })
})
@Getter
@Setter
@NoArgsConstructor
public class StaffAccount {

    @Id
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Column(name = "login_id", nullable = false, length = 100)
    private String loginId;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 30)
    private Role role; // COMMITTEE or ADMIN

    @Column(name = "assigned_pref_code", length = 10)
    private String assignedPrefCode;

    @Column(name = "assigned_city_code", length = 10)
    private String assignedCityCode;

    @Column(name = "is_enabled", nullable = false)
    private boolean enabled;

    @Column(name = "is_locked", nullable = false)
    private boolean locked;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null)
            id = UUID.randomUUID();
        var now = Instant.now();
        if (createdAt == null)
            createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
