package com.bteam.ovs.voting.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vote_alloc_cast", indexes = {
        @Index(name = "ix_vote_alloc_cast_election_id", columnList = "election_id"),
        @Index(name = "ix_vote_alloc_cast_citizen_id", columnList = "citizen_id"),
        @Index(name = "ix_vote_alloc_cast_election_citizen", columnList = "election_id, citizen_id")
})
@Getter
@Setter
@NoArgsConstructor
public class VoteAllocCast {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "election_id", nullable = false, columnDefinition = "uuid")
    private UUID electionId;

    @Column(name = "citizen_id", nullable = false, columnDefinition = "uuid")
    private UUID citizenId;

    @Column(name = "points_total", nullable = false)
    private Integer pointsTotal;

    @Column(name = "casted_at", nullable = false)
    private Instant castedAt;

    @PrePersist
    void onCreate() {
        if (id == null)
            id = UUID.randomUUID();
        if (castedAt == null)
            castedAt = Instant.now();
        if (pointsTotal == null)
            pointsTotal = 100;
    }
}
