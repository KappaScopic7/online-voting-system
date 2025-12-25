package com.bteam.ovs.voter.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "nfc_credential",
    uniqueConstraints = @UniqueConstraint(name = "uk_nfc_card_id", columnNames = "card_id")
)
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NfcCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "card_id", nullable = false, length = 64)
    private String cardId;

    @Column(name = "pin_hash", nullable = false, length = 255)
    private String pinHash;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "voter_account_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_nfc_voter_account"))
    private VoterAccount voterAccount;
}
