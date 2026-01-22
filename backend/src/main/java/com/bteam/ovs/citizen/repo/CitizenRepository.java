package com.bteam.ovs.citizen.repo;

import com.bteam.ovs.citizen.model.Citizen;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CitizenRepository extends JpaRepository<Citizen, UUID> {
}
