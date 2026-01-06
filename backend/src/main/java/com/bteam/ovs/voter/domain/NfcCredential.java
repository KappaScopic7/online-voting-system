package com.bteam.ovs.voter.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "nfc_credential", indexes = {
    @Index(name = "ix_nfc_credential_card_id", columnList = "card_id", unique = true)
})
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

    public Long getId() { return id; }
    public String getCardId() { return cardId; }
    public String getPinHash() { return pinHash; }
    public Long getVoterId() { return voterId; }

    public void setCardId(String cardId) { this.cardId = cardId; }
    public void setPinHash(String pinHash) { this.pinHash = pinHash; }
    public void setVoterId(Long voterId) { this.voterId = voterId; }
}
