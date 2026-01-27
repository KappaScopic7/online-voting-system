package com.bteam.ovs.elections.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.bteam.ovs.elections.entity.Election;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ElectionRepository extends JpaRepository<Election, UUID> {
    int deleteByTitleStartingWith(String prefix);

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

    Optional<Election> findByElectionKey(String electionKey);

    boolean existsByElectionKey(String electionKey);

    void deleteAll(); // 既にあるはず

}
