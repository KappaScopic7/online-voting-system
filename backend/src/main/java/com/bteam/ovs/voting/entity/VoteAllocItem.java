package com.bteam.ovs.voting.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "vote_alloc_item", indexes = {
        @Index(name = "ix_vote_alloc_item_cast_id", columnList = "cast_id"),
        @Index(name = "ix_vote_alloc_item_candidate_id", columnList = "candidate_id"),
        @Index(name = "ix_vote_alloc_item_party_id", columnList = "party_id")
})
@Getter
@Setter
@NoArgsConstructor
public class VoteAllocItem {

    public enum TargetType {
        CANDIDATE, PARTY, NONE_SUPPORT
    }

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "cast_id", nullable = false, columnDefinition = "uuid")
    private UUID castId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 32)
    private TargetType targetType;

    @Column(name = "candidate_id", columnDefinition = "uuid")
    private UUID candidateId; // CANDIDATE のときだけ

    @Column(name = "party_id", columnDefinition = "uuid")
    private UUID partyId; // PARTY のときだけ

    @Column(name = "points", nullable = false)
    private Integer points;

    @PrePersist
    void onCreate() {
        if (id == null)
            id = UUID.randomUUID();
    }
}
