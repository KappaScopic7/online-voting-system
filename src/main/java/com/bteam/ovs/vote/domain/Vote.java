package com.bteam.ovs.vote.domain;

import com.bteam.ovs.election.domain.Candidate;
import com.bteam.ovs.election.domain.Election;
import com.bteam.ovs.voter.domain.VoterAccount;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "vote",
        indexes = {
                @Index(name = "idx_vote_election_voter", columnList = "election_id, voter_account_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * どの選挙への投票か
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "election_id", nullable = false)
    private Election election;

    /**
     * どの有権者の投票か
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "voter_account_id", nullable = false)
    private VoterAccount voterAccount;

    /**
     * 選択された候補者
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private VoteStatus status;

    @Column(name = "voted_at", nullable = false)
    private LocalDateTime votedAt;

    @PrePersist
    public void onCreate() {
        if (this.votedAt == null) {
            this.votedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = VoteStatus.ACTIVE;
        }
    }
}
