package com.bteam.ovs.voting.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vote_alloc_current", indexes = {
        @Index(name = "ix_vote_alloc_current_election_id", columnList = "election_id")
})
@Getter
@Setter
@NoArgsConstructor
@IdClass(VoteAllocCurrentKey.class)
public class VoteAllocCurrent {

    @Id
    @Column(name = "election_id", nullable = false, columnDefinition = "uuid")
    private UUID electionId;

    @Id
    @Column(name = "citizen_id", nullable = false, columnDefinition = "uuid")
    private UUID citizenId;

    @Column(name = "cast_id", nullable = false, columnDefinition = "uuid")
    private UUID castId;

    @Column(name = "casted_at", nullable = false)
    private Instant castedAt;

    @PrePersist
    void onCreate() {
        if (castedAt == null)
            castedAt = Instant.now();
    }

    void onUpdate() {
        castedAt = Instant.now();
    }
}
