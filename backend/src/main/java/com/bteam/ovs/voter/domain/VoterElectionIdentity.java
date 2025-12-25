package com.bteam.ovs.voter.domain;

import com.bteam.ovs.election.domain.Election;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "voter_election_identity",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_voter_election_identity",
        columnNames = {"voter_account_id", "election_id"}
    )
)
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoterElectionIdentity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "voter_account_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_vei_voter_account"))
    private VoterAccount voterAccount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "election_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_vei_election"))
    private Election election;

    @Column(name = "verified_at", nullable = false)
    private LocalDateTime verifiedAt;
}
