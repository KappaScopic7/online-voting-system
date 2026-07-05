package com.bteam.ovs.identity.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.bteam.ovs.identity.entity.NfcCredential;

public interface NfcCredentialRepository extends JpaRepository<NfcCredential, Long> {
    Optional<NfcCredential> findByCardId(String cardId);
}
