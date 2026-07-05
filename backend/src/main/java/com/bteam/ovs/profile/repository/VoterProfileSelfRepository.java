package com.bteam.ovs.profile.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.bteam.ovs.profile.entity.VoterProfileSelf;
import java.util.UUID;

public interface VoterProfileSelfRepository extends JpaRepository<VoterProfileSelf, UUID> {
}
