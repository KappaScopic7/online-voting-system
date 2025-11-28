package com.bteam.ovs.citizen.repository;

import com.bteam.ovs.citizen.domain.Citizen;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CitizenRepository extends JpaRepository<Citizen, Long> {

    Optional<Citizen> findByPseudoMyNumber(String pseudoMyNumber);
}
