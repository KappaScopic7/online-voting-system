package com.bteam.ovs.auth.infra.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PortalAccountJpaRepository extends JpaRepository<PortalAccountEntity, UUID> {
    Optional<PortalAccountEntity> findByEmail(String email);
    boolean existsByEmail(String email);
}
