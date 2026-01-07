package com.bteam.ovs.demo;

import com.bteam.ovs.elections.model.Candidate;
import com.bteam.ovs.elections.model.Election;
import com.bteam.ovs.elections.repo.CandidateRepository;
import com.bteam.ovs.elections.repo.ElectionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Profile("demo")
@Configuration
public class DemoBootstrap {

    @Bean
    CommandLineRunner demoInit(
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo
    ) {
        return args -> init(electionRepo, candidateRepo);
    }

    @Transactional
    void init(ElectionRepository electionRepo, CandidateRepository candidateRepo) {
        // ここが「生成の全体像」になるようにログを置く（実務向け）
        System.out.println("""
            [DEMO] Bootstrap start
            - DB server: docker-compose (postgres)
            - Schema: JPA ddl-auto (hibernate)
            - Seed: DemoBootstrap
            """);

        var now = Instant.now();

        // 「投票可能(ONGOING)が1件も無ければ作る」
        boolean hasOngoing = electionRepo.existsOngoing(now);
        if (!hasOngoing) {
            String title = "デモ選挙 " + LocalDate.now();

            var e = new Election();
            e.setTitle(title);
            e.setStartsAt(now.minusSeconds(3600));        // 1時間前
            e.setEndsAt(now.plusSeconds(3600 * 24));      // 24時間後
            electionRepo.save(e);

            upsertCandidates(candidateRepo, e.getId(), List.of("候補A", "候補B"));
            System.out.println("[DEMO] Created election: " + e.getId() + " " + title);
        } else {
            System.out.println("[DEMO] Ongoing election exists. Skip creation.");
        }

        System.out.println("[DEMO] Bootstrap end");

        System.out.println("[DEMO] now=" + now);

        var ongoing = electionRepo.findOngoing(now); // これ作る（下）
        System.out.println("[DEMO] ongoing count=" + ongoing.size());
        ongoing.forEach(e ->
            System.out.println("[DEMO] ongoing: id=" + e.getId()
                + " startsAt=" + e.getStartsAt()
                + " endsAt=" + e.getEndsAt())
        );


    }

    private void upsertCandidates(CandidateRepository candidateRepo, java.util.UUID electionId, List<String> names) {
        // 「同じ選挙IDに候補が存在しないなら作る」くらいでOK
        var existing = candidateRepo.findByElectionId(electionId);
        if (!existing.isEmpty()) return;

        for (var name : names) {
            var c = new Candidate();
            c.setElectionId(electionId);
            c.setName(name);
            candidateRepo.save(c);
        }
    }
}
