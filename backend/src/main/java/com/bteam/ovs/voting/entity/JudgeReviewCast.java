package com.bteam.ovs.voting.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "judge_review_cast", uniqueConstraints = {
        @UniqueConstraint(name = "uq_jr_cast_election_citizen", columnNames = { "election_id", "citizen_id" })
})
@Getter
@Setter
public class JudgeReviewCast {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "election_id", nullable = false)
    private UUID electionId;

    @Column(name = "citizen_id", nullable = false)
    private UUID citizenId;

    @Column(name = "casted_at", nullable = false)
    private Instant castedAt;

    public UUID getId() {
        return id;
    }
}
