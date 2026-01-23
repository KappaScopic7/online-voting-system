package com.bteam.ovs.citizen.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "citizen")
@Getter
@Setter
@NoArgsConstructor
public class Citizen {

    @Id
    @Column(name = "citizen_id", columnDefinition = "uuid")
    private UUID citizenId;

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
        if (citizenId == null) citizenId = UUID.randomUUID();
        var now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
