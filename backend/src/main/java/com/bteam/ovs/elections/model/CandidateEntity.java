package com.bteam.ovs.elections.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "candidate",
        indexes = @Index(name = "ix_candidate_election_id", columnList = "election_id"))
public class CandidateEntity {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "election_id", nullable = false, columnDefinition = "uuid")
    private UUID electionId;

    @Column(nullable = false, length = 120)
    private String name;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getElectionId() { return electionId; }
    public void setElectionId(UUID electionId) { this.electionId = electionId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
