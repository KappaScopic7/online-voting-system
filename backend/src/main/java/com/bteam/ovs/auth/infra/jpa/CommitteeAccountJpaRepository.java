package com.bteam.ovs.auth.infra.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CommitteeAccountJpaRepository extends JpaRepository<CommitteeAccountEntity, UUID> {
    Optional<CommitteeAccountEntity> findByLoginId(String loginId);
    boolean existsByLoginId(String loginId);
}
