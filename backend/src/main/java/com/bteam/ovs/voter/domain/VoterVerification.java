package com.bteam.ovs.voter.domain;

import com.bteam.ovs.election.domain.Election;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "voter_verification",
        uniqueConstraints = @UniqueConstraint(name = "uq_voter_verification", columnNames = {"voter_account_id", "election_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoterVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "voter_account_id", nullable = false)
    private VoterAccount voterAccount;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "election_id", nullable = false)
    private Election election;

    @Column(nullable = false)
    private boolean verified;

    @Column(nullable = false)
    private LocalDateTime verifiedAt;

    @Column(nullable = false)
    private String method; // "DEV_NFC" とか

    @Column(nullable = true, length = 128)
    private String cardIdMasked; // 本番ならマスク/ハッシュ。デモでも生値は避ける。
}
