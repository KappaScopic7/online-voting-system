package com.bteam.ovs.elections.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bteam.ovs.elections.model.ElectionEntity;

import java.util.UUID;

public interface ElectionRepository extends JpaRepository<ElectionEntity, UUID> {}
