package com.bteam.ovs.identity.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bteam.ovs.identity.model.NfcCredential;

public interface NfcCredentialRepository extends JpaRepository<NfcCredential, Long> {
    Optional<NfcCredential> findByCardId(String cardId);
}
