package com.bteam.ovs.voter.repository;

import com.bteam.ovs.voter.domain.NfcCredential;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NfcCredentialRepository extends JpaRepository<NfcCredential, Long> {
    Optional<NfcCredential> findByCardId(String cardId);
}
