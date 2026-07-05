package com.bteam.ovs.identity.repository;

import com.bteam.ovs.identity.entity.VotePairing;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface VotePairingRepository extends JpaRepository<VotePairing, UUID> {
}
