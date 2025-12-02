package com.bteam.ovs.election.repository;

import com.bteam.ovs.election.domain.District;
import com.bteam.ovs.election.domain.Election;
import com.bteam.ovs.election.domain.ElectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ElectionRepository extends JpaRepository<Election, Long> {

    List<Election> findByDistrictOrderByStartsAtDesc(District district);

    List<Election> findByDistrictAndStatusInOrderByStartsAtDesc(
            District district,
            List<ElectionStatus> statuses
    );

    List<Election> findByDistrictAndEndsAtAfterOrderByStartsAtAsc(
            District district,
            LocalDateTime now
    );
}
