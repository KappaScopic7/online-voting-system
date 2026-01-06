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
import java.util.UUID;

@Profile("demo")
@Configuration
public class ElectionSeedData {

    // 固定ID（毎回同じものを使う）
    private static final UUID DEMO_ELECTION_ID =
            UUID.fromString("11111111-1111-1111-1111-111111111111");

    private static final UUID CANDIDATE_A_ID =
            UUID.fromString("22222222-2222-2222-2222-222222222222");

    private static final UUID CANDIDATE_B_ID =
            UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Bean
    CommandLineRunner seedElection(
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo
    ) {
        return args -> {

            // ===== Election upsert =====
            var now = Instant.now();

            var election = electionRepo.findById(DEMO_ELECTION_ID)
                    .orElseGet(() -> {
                        var e = new ElectionEntity();
                        e.setId(DEMO_ELECTION_ID);
                        return e;
                    });

            election.setTitle("デモ選挙");
            election.setStartsAt(now.minusSeconds(3600));          // 1時間前から開始
            election.setEndsAt(now.plusSeconds(3600 * 24));        // 24時間後まで

            electionRepo.save(election);

            // ===== Candidate A upsert =====
            var c1 = candidateRepo.findById(CANDIDATE_A_ID)
                    .orElseGet(() -> {
                        var c = new CandidateEntity();
                        c.setId(CANDIDATE_A_ID);
                        return c;
                    });

            c1.setElectionId(DEMO_ELECTION_ID);
            c1.setName("候補A");
            candidateRepo.save(c1);

            // ===== Candidate B upsert =====
            var c2 = candidateRepo.findById(CANDIDATE_B_ID)
                    .orElseGet(() -> {
                        var c = new CandidateEntity();
                        c.setId(CANDIDATE_B_ID);
                        return c;
                    });

            c2.setElectionId(DEMO_ELECTION_ID);
            c2.setName("候補B");
            candidateRepo.save(c2);
        };
    }
}
