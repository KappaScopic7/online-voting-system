package com.bteam.ovs.portal.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bteam.ovs.portal.domain.PortalAccount;

public interface PortalAccountRepository extends JpaRepository<PortalAccount, UUID> {
    Optional<PortalAccount> findByEmail(String email);
    boolean existsByLinkedVoterId(Long linkedVoterId);
}
