package com.bteam.ovs.election.infra.jpa;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Instant;

@Configuration
public class ElectionSeedData {

    @Bean
    CommandLineRunner seedElection(ElectionJpaRepository electionRepo, CandidateJpaRepository candidateRepo) {
        return args -> {
            if (electionRepo.count() > 0) return;

            var e = new ElectionEntity();
            e.setTitle("デモ選挙");
            e.setStartsAt(Instant.now().minusSeconds(3600));
            e.setEndsAt(Instant.now().plusSeconds(3600 * 24));
            electionRepo.save(e);

            var c1 = new CandidateEntity();
            c1.setElectionId(e.getId());
            c1.setName("候補A");
            candidateRepo.save(c1);

            var c2 = new CandidateEntity();
            c2.setElectionId(e.getId());
            c2.setName("候補B");
            candidateRepo.save(c2);
        };
    }
}
