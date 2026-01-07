package com.bteam.ovs.demo;

import com.bteam.ovs.elections.model.Candidate;
import com.bteam.ovs.elections.model.Election;
import com.bteam.ovs.elections.repo.CandidateRepository;
import com.bteam.ovs.elections.repo.ElectionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Profile("demo")
@Configuration
public class DemoBootstrap {

    @Bean
    CommandLineRunner demoInit(
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            TransactionTemplate tx
    ) {
        return args -> tx.executeWithoutResult(status -> init(electionRepo, candidateRepo));
    }

    void init(ElectionRepository electionRepo, CandidateRepository candidateRepo) {
        System.out.println("""
            [DEMO] Bootstrap start
            - DB server: docker-compose (postgres)
            - Schema: JPA ddl-auto (hibernate)
            - Seed: DemoBootstrap
            """);

        var now = Instant.now();

        // ★デモ選挙だけ掃除（本物のデータを消さない）
        int deleted = electionRepo.deleteByTitleStartingWith("デモ選挙 ");
        System.out.println("[DEMO] Deleted demo elections: " + deleted);

        // ★毎回新規作成
        String title = "デモ選挙 " + LocalDate.now() + " " + now.toString();

        var e = new Election();
        e.setTitle(title);
        e.setStartsAt(now.minusSeconds(60));          // 1分前開始
        e.setEndsAt(now.plusSeconds(3600 * 24));      // 24時間後
        electionRepo.save(e);

        createCandidates(candidateRepo, e.getId(), List.of("候補A", "候補B"));
        System.out.println("[DEMO] Created election: " + e.getId() + " " + title);

        System.out.println("[DEMO] Bootstrap end");
    }

    private void createCandidates(CandidateRepository candidateRepo, UUID electionId, List<String> names) {
        for (var name : names) {
            var c = new Candidate();
            c.setElectionId(electionId);
            c.setName(name);
            candidateRepo.save(c);
        }
    }
}
