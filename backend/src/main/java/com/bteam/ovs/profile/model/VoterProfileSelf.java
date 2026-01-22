package com.bteam.ovs.profile.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "voter_profile_self")
@Getter
@Setter
@NoArgsConstructor
public class VoterProfileSelf {

    @Id
    @Column(name = "account_id", columnDefinition = "uuid")
    private UUID accountId;

    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    @Column(name = "pref_code", nullable = false, length = 10)
    private String prefCode;

    @Column(name = "city_code", nullable = false, length = 10)
    private String cityCode;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        // accountId は「ログイン中ユーザーのID」を必ずセットして保存する想定
        if (accountId == null) throw new IllegalStateException("accountId is required");
        var now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
