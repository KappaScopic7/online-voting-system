package com.bteam.ovs.voting.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "vote_current",
    indexes = {
        @Index(name = "ix_vote_current_election_id", columnList = "election_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@IdClass(VoteCurrentKey.class)
public class VoteCurrent {

    @Id
    @Column(name = "election_id", nullable = false, columnDefinition = "uuid")
    private UUID electionId;

    @Id
    @Column(name = "citizen_id", nullable = false, columnDefinition = "uuid")
    private UUID citizenId;

    @Column(name = "candidate_id", nullable = false, columnDefinition = "uuid")
    private UUID candidateId;

    @Column(name = "casted_at", nullable = false)
    private Instant castedAt;

    @PrePersist
    void onCreate() {
        if (castedAt == null) castedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        castedAt = Instant.now();
    }
}
