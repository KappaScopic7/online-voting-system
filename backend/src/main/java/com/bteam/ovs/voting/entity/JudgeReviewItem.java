package com.bteam.ovs.voting.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Entity
@Table(name = "judge_review_item", uniqueConstraints = {
        @UniqueConstraint(name = "uq_jr_item_cast_judge", columnNames = { "cast_id", "judge_candidate_id" })
})
@Getter
@Setter
public class JudgeReviewItem {

    public enum Choice {
        OK, // 信任
        NO // 罷免
    }

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "cast_id", nullable = false)
    private UUID castId;

    @Column(name = "judge_candidate_id", nullable = false)
    private UUID judgeCandidateId;

    @Enumerated(EnumType.STRING)
    @Column(name = "choice", nullable = false)
    private Choice choice;

}
