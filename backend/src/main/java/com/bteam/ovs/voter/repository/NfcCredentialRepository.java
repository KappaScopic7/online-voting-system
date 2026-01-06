package com.bteam.ovs.voter.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bteam.ovs.voter.domain.NfcCredential;

public interface NfcCredentialRepository extends JpaRepository<NfcCredential, Long> {
    Optional<NfcCredential> findByCardId(String cardId);
}
