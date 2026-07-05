package com.bteam.ovs.identity.repository;

import com.bteam.ovs.identity.entity.LinkPairing;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface LinkPairingRepository extends JpaRepository<LinkPairing, UUID> {
}
