package com.bteam.ovs.citizen;

import com.bteam.ovs.citizen.domain.Citizen;
import com.bteam.ovs.citizen.repository.CitizenRepository;
import com.bteam.ovs.voter.domain.VoterAccount;
import com.bteam.ovs.voter.domain.VoterStatus;
import com.bteam.ovs.voter.repository.VoterAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class TestCitizenDataInitializer implements CommandLineRunner {

    private final CitizenRepository citizenRepository;
    private final VoterAccountRepository voterAccountRepository;

    @Override
    public void run(String... args) {
        if (citizenRepository.count() > 0) {
            // すでに投入済みなら何もしない
            return;
        }

        // ダミー市民データ（実際はCSVやSQLから読み込んでもよい）
        List<Citizen> citizens = List.of(
            Citizen.builder()
                .pseudoMyNumber("CITIZEN-000001")
                .familyName("山田")
                .givenName("太郎")
                .prefecture("東京都")
                .city("町田市")
                .addressLine("1-1-1")
                .dateOfBirth(LocalDate.of(1990, 1, 1))
                .build(),
            Citizen.builder()
                .pseudoMyNumber("CITIZEN-000002")
                .familyName("佐藤")
                .givenName("花子")
                .prefecture("東京都")
                .city("町田市")
                .addressLine("2-2-2")
                .dateOfBirth(LocalDate.of(1992, 2, 2))
                .build()
            // 必要なら増やす
        );

        citizens = citizenRepository.saveAll(citizens);

        for (Citizen citizen : citizens) {
            VoterAccount account = VoterAccount.builder()
                .citizen(citizen)
                .status(VoterStatus.PENDING)
                .build();
            voterAccountRepository.save(account);
        }
    }
}
