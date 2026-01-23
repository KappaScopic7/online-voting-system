package com.bteam.ovs.voting.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bteam.ovs.voting.entity.VoteCast;

import java.util.List;
import java.util.UUID;

public interface VoteCastRepository extends JpaRepository<VoteCast, UUID> {
    List<VoteCast> findByCitizenIdOrderByCastedAtDesc(UUID citizenId);
}
