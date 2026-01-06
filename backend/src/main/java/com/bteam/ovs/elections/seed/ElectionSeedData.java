package com.bteam.ovs.elections.seed;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import com.bteam.ovs.elections.model.CandidateEntity;
import com.bteam.ovs.elections.model.ElectionEntity;
import com.bteam.ovs.elections.repo.CandidateRepository;
import com.bteam.ovs.elections.repo.ElectionRepository;

import java.time.Instant;

@Profile("demo")
@Configuration
public class ElectionSeedData {

    @Bean
    CommandLineRunner seedElection(
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo
    ) {
        return args -> {
            var now = Instant.now();

            String title = "デモ選挙 " + java.time.LocalDate.now();

            // 既に今日のデモ選挙があれば何もしない
            var electionOpt = electionRepo.findByTitle(title);
            if (electionOpt.isPresent()) {
                return;
            }

            // ===== Election create =====
            var election = new ElectionEntity();
            election.setTitle(title);
            election.setStartsAt(now.minusSeconds(3600));
            election.setEndsAt(now.plusSeconds(3600 * 24));
            electionRepo.save(election);

            // ===== Candidates =====
            var c1 = new CandidateEntity();
            c1.setElectionId(election.getId());
            c1.setName("候補A");
            candidateRepo.save(c1);

            var c2 = new CandidateEntity();
            c2.setElectionId(election.getId());
            c2.setName("候補B");
            candidateRepo.save(c2);
        };
    }
}
