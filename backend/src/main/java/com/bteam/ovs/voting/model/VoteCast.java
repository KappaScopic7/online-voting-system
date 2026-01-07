package com.bteam.ovs.voting.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "vote_cast",
    indexes = {
        @Index(name = "ix_vote_cast_election_id", columnList = "election_id"),
        @Index(name = "ix_vote_cast_citizen_id", columnList = "citizen_id"),
        @Index(name = "ix_vote_cast_election_citizen", columnList = "election_id, citizen_id")
    }
)
public class VoteCast {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "election_id", nullable = false, columnDefinition = "uuid")
    private UUID electionId;

    @Column(name = "citizen_id", nullable = false, columnDefinition = "uuid")
    private UUID citizenId;

    @Column(name = "candidate_id", nullable = false, columnDefinition = "uuid")
    private UUID candidateId;

    @Column(name = "casted_at", nullable = false)
    private Instant castedAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (castedAt == null) castedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getElectionId() { return electionId; }
    public void setElectionId(UUID electionId) { this.electionId = electionId; }
    public UUID getCitizenId() { return citizenId; }
    public void setCitizenId(UUID citizenId) { this.citizenId = citizenId; }
    public UUID getCandidateId() { return candidateId; }
    public void setCandidateId(UUID candidateId) { this.candidateId = candidateId; }
    public Instant getCastedAt() { return castedAt; }
    public void setCastedAt(Instant castedAt) { this.castedAt = castedAt; }
}
