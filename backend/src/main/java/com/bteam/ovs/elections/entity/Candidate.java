package com.bteam.ovs.elections.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "candidate", indexes = {
        @Index(name = "ix_candidate_election_id", columnList = "election_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_candidate_election_id_name", columnNames = { "election_id", "name" })
})
@Getter
@Setter
@NoArgsConstructor
public class Candidate {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "election_id", nullable = false, columnDefinition = "uuid")
    private UUID electionId;

    @Column(nullable = false, length = 120)
    private String name;

    @PrePersist
    void onCreate() {
        if (id == null)
            id = UUID.randomUUID();
    }
}
