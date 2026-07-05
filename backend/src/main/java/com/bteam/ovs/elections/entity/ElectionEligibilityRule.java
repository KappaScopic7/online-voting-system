package com.bteam.ovs.elections.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "election_eligibility_rule", indexes = {
        @Index(name = "ix_eer_election_id", columnList = "election_id"),
        @Index(name = "ix_eer_city_code", columnList = "city_code")
})
@Getter
@Setter
@NoArgsConstructor
public class ElectionEligibilityRule {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "election_id", nullable = false, columnDefinition = "uuid")
    private UUID electionId;

    @Column(name = "city_code", nullable = false, length = 10)
    private String cityCode;

    // null = 年齢条件なし
    @Column(name = "min_age", nullable = true)
    private Integer minAge;

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
