package com.bteam.ovs.citizen;

import com.bteam.ovs.citizen.domain.Citizen;
import com.bteam.ovs.citizen.repository.CitizenRepository;
import com.bteam.ovs.election.domain.District;
import com.bteam.ovs.election.domain.Election;
import com.bteam.ovs.election.domain.ElectionStatus;
import com.bteam.ovs.election.repository.DistrictRepository;
import com.bteam.ovs.election.repository.ElectionRepository;
import com.bteam.ovs.voter.domain.VoterAccount;
import com.bteam.ovs.voter.domain.VoterStatus;
import com.bteam.ovs.voter.repository.VoterAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class TestCitizenDataInitializer implements CommandLineRunner {

    private final CitizenRepository citizenRepository;
    private final VoterAccountRepository voterAccountRepository;
    private final DistrictRepository districtRepository;
    private final ElectionRepository electionRepository;

    @Override
    public void run(String... args) {
        if (citizenRepository.count() > 0) {
            // すでに投入済みなら何もしない
            return;
        }

        // 1. 選挙区を作成
        District machida1 = District.builder()
                .code("TOKYO-MACHIDA-01")
                .name("東京都町田市第1区")
                .prefecture("東京都")
                .city("町田市")
                .build();

        machida1 = districtRepository.save(machida1);

        // 2. 市民データを作成（同じ選挙区を紐付け）
        List<Citizen> citizens = List.of(
            Citizen.builder()
                .pseudoMyNumber("CITIZEN-000001")
                .familyName("山田")
                .givenName("太郎")
                .prefecture("東京都")
                .city("町田市")
                .addressLine("1-1-1")
                .dateOfBirth(LocalDate.of(1990, 1, 1))
                .district(machida1)
                .build(),
            Citizen.builder()
                .pseudoMyNumber("CITIZEN-000002")
                .familyName("佐藤")
                .givenName("花子")
                .prefecture("東京都")
                .city("町田市")
                .addressLine("2-2-2")
                .dateOfBirth(LocalDate.of(1992, 2, 2))
                .district(machida1)
                .build()
        );

        citizens = citizenRepository.saveAll(citizens);

        // 3. VoterAccount を全件作成（メール/パスワードは null、PENDING）
        for (Citizen citizen : citizens) {
            VoterAccount account = VoterAccount.builder()
                    .citizen(citizen)
                    .status(VoterStatus.PENDING)
                    .build();
            voterAccountRepository.save(account);
        }

        // 4. 選挙データを作成（この選挙区向け）
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

        electionRepository.saveAll(List.of(election1, election2));
    }
}
