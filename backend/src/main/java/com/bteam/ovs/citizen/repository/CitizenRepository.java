package com.bteam.ovs.citizen.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.bteam.ovs.citizen.entity.Citizen;
import java.util.UUID;

public interface CitizenRepository extends JpaRepository<Citizen, UUID> {
}
