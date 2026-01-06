package com.bteam.ovs.auth.repo;

import com.bteam.ovs.auth.model.PortalAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PortalAccountRepository extends JpaRepository<PortalAccount, UUID> {
    Optional<PortalAccount> findByEmail(String email);
    boolean existsByEmail(String email);
}
