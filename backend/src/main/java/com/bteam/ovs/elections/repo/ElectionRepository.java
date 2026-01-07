package com.bteam.ovs.elections.repo;

import com.bteam.ovs.elections.model.Election;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ElectionRepository extends JpaRepository<Election, UUID> {

    @Query("""
        select (count(e) > 0)
        from Election e
        where e.startsAt <= :now and e.endsAt > :now
    """)
    boolean existsOngoing(@Param("now") Instant now);

    @Query("""
        select e
        from Election e
        where e.startsAt <= :now and e.endsAt > :now
        order by e.startsAt desc
    """)
    List<Election> findOngoing(@Param("now") Instant now);

    List<Election> findAllByOrderByStartsAtDesc();
}
