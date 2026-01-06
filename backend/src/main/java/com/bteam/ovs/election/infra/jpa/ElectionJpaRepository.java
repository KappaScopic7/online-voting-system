package com.bteam.ovs.election.infra.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ElectionJpaRepository extends JpaRepository<ElectionEntity, UUID> {}
