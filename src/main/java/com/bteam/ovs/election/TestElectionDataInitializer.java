package com.bteam.ovs.election;

import com.bteam.ovs.election.domain.Candidate;
import com.bteam.ovs.election.domain.District;
import com.bteam.ovs.election.domain.Election;
import com.bteam.ovs.election.domain.ElectionStatus;
import com.bteam.ovs.election.repository.CandidateRepository;
import com.bteam.ovs.election.repository.DistrictRepository;
import com.bteam.ovs.election.repository.ElectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class TestElectionDataInitializer implements CommandLineRunner {

    private final DistrictRepository districtRepository;
    private final ElectionRepository electionRepository;
    private final CandidateRepository candidateRepository;

    @Override
    public void run(String... args) {
        if (electionRepository.count() > 0) {
            return;
        }

        // District が先に作られている前提（TestCitizenDataInitializer）
        District machida1 = districtRepository.findByCode("TOKYO-MACHIDA-01")
                .orElseThrow(() -> new IllegalStateException("District TOKYO-MACHIDA-01 not found"));

        LocalDateTime now = LocalDateTime.now();

        Election election1 = Election.builder()
                .code("SANGIIN-2025-TOKYO-MACHIDA")
                .name("第26回参議院議員通常選挙")
                .description("テスト用ダミー選挙1")
                .district(machida1)
                .startsAt(now.plusDays(7))
                .endsAt(now.plusDays(14))
                .status(ElectionStatus.PUBLISHED)
                .build();

        Election election2 = Election.builder()
                .code("SHUGIIN-2025-TOKYO-MACHIDA")
                .name("第51回衆議院議員総選挙")
                .description("テスト用ダミー選挙2")
                .district(machida1)
                .startsAt(now.minusDays(1))
                .endsAt(now.plusDays(1))
                .status(ElectionStatus.OPEN)
                .build();

        election1 = electionRepository.save(election1);
        election2 = electionRepository.save(election2);

        // 候補者（超適当ダミー）
        List<Candidate> candidates = List.of(
                Candidate.builder()
                        .name("山田 一郎")
                        .partyName("テスト党A")
                        .profile("テスト用候補者A1")
                        .displayOrder(1)
                        .election(election2)
                        .build(),
                Candidate.builder()
                        .name("佐藤 二郎")
                        .partyName("テスト党B")
                        .profile("テスト用候補者B1")
                        .displayOrder(2)
                        .election(election2)
                        .build(),
                Candidate.builder()
                        .name("高橋 三郎")
                        .partyName("テスト党C")
                        .profile("テスト用候補者C1")
                        .displayOrder(3)
                        .election(election2)
                        .build()
        );

        candidateRepository.saveAll(candidates);
    }
}
