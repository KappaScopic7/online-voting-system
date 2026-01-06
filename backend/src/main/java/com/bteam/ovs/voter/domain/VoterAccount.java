package com.bteam.ovs.voter.domain;

import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.*;

@Entity
@Table(name = "voter_account", indexes = {
    @Index(name = "ix_voter_account_voter_id", columnList = "voter_id", unique = true)
})
public class VoterAccount {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name="voter_id", nullable=false, unique=true)
    private Long voterId;

    public UUID getId() { return id; }
    public Long getVoterId() { return voterId; }
    public void setVoterId(Long voterId) { this.voterId = voterId; }
}
