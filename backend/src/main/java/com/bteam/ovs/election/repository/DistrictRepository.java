package com.bteam.ovs.election.repository;

import com.bteam.ovs.election.domain.District;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DistrictRepository extends JpaRepository<District, Long> {

    Optional<District> findByCode(String code);
}
