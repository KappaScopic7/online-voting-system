package com.bteam.ovs.identity.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "nfc_credential", indexes = {
    @Index(name = "ix_nfc_credential_card_id", columnList = "card_id", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
public class NfcCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="card_id", nullable=false, unique=true, length=64)
    private String cardId;

    @Column(name="pin_hash", nullable=false, length=200)
    private String pinHash;

    @Column(name="voter_id", nullable=false)
    private Long voterId;
}
