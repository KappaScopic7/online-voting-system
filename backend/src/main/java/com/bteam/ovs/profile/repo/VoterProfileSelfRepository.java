package com.bteam.ovs.profile.repo;

import com.bteam.ovs.profile.model.VoterProfileSelf;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface VoterProfileSelfRepository extends JpaRepository<VoterProfileSelf, UUID> {
}
