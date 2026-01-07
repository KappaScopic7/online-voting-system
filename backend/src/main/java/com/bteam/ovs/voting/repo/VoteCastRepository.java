package com.bteam.ovs.voting.repo;

import com.bteam.ovs.voting.model.VoteCast;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VoteCastRepository extends JpaRepository<VoteCast, UUID> {
    List<VoteCast> findByCitizenIdOrderByCastedAtDesc(UUID citizenId);
}
