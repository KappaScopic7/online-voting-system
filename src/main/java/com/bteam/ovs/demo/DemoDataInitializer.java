package com.bteam.ovs.demo;

import com.bteam.ovs.citizen.domain.Citizen;
import com.bteam.ovs.citizen.repository.CitizenRepository;
import com.bteam.ovs.election.domain.Candidate;
import com.bteam.ovs.election.domain.District;
import com.bteam.ovs.election.domain.Election;
import com.bteam.ovs.election.domain.ElectionStatus;
import com.bteam.ovs.election.repository.CandidateRepository;
import com.bteam.ovs.election.repository.DistrictRepository;
import com.bteam.ovs.election.repository.ElectionRepository;
import com.bteam.ovs.vote.domain.Vote;
import com.bteam.ovs.vote.domain.VoteStatus;
import com.bteam.ovs.vote.repository.VoteRepository;
import com.bteam.ovs.voter.domain.VoterAccount;
import com.bteam.ovs.voter.repository.VoterAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DemoDataInitializer implements CommandLineRunner {

    private final DistrictRepository districtRepository;
    private final CitizenRepository citizenRepository;
    private final VoterAccountRepository voterAccountRepository;
    private final ElectionRepository electionRepository;
    private final CandidateRepository candidateRepository;
    private final VoteRepository voteRepository;

    @Override
    public void run(String... args) {
        // すでに Citizen や Election が入っているなら何もしない（本番データ汚さない）
        if (citizenRepository.count() > 0 || electionRepository.count() > 0) {
            return;
        }

        // --- District（町田1区） ---
        District machida1 = districtRepository.findByCode("TOKYO-MACHIDA-01")
            .orElseGet(() -> {
                District d = new District();
                d.setCode("TOKYO-MACHIDA-01");
                d.setName("東京都町田市第1区");

                // ★ 必須カラムをちゃんと埋める
                d.setPrefecture("東京都");   // Districtにprefectureフィールドがある想定
                d.setCity("町田市");        // Districtにcityフィールドがある想定

                return districtRepository.save(d);
            });

        // --- Citizen を複数作成 ---
        List<Citizen> citizens = new ArrayList<>();
        for (int i = 1; i <= 30; i++) {
            String pseudoMyNumber = "CITIZEN-%06d".formatted(i);

            Citizen c = Citizen.builder()
                    .pseudoMyNumber(pseudoMyNumber)
                    .familyName("山田")
                    .givenName("太郎" + i)
                    .prefecture("東京都")
                    .city("町田市")
                    .addressLine("テスト" + i + "丁目")
                    .dateOfBirth(LocalDate.of(1990, 1, 1).plusDays(i))
                    .district(machida1)
                    .build();

            citizens.add(c);
        }
        citizens = citizenRepository.saveAll(citizens);

        // --- Citizen ごとに 1 VoterAccount 作成 ---
        List<VoterAccount> accounts = new ArrayList<>();
        VoterAccount demoVoter = null; // CITIZEN-000001 用

        for (int idx = 0; idx < citizens.size(); idx++) {
            Citizen citizen = citizens.get(idx);

            VoterAccount va = VoterAccount.builder()
                    .citizen(citizen)
                    // email/passwordHash/status は null → @PrePersist で PENDING になる
                    .build();

            // 双方向関連を維持しておく（必須ではないがきれいにしておく）
            citizen.setVoterAccount(va);

            if (idx == 0) {
                // 最初の Citizen (CITIZEN-000001) をデモ用ユーザーとする
                demoVoter = va;
            }

            accounts.add(va);
        }
        accounts = voterAccountRepository.saveAll(accounts);

        LocalDateTime now = LocalDateTime.now();

        // --- ① OPEN 選挙（今投票できる） ---
        Election openElection = Election.builder()
                .code("SHUGIIN-TEST-OPEN-TOKYO-MACHIDA")
                .name("【テスト】オンライン投票テスト用選挙（OPEN）")
                .description("いま投票できるテスト用の選挙です。")
                .district(machida1)
                .startsAt(now.minusHours(1))
                .endsAt(now.plusDays(1))
                .status(ElectionStatus.OPEN)
                .build();

        // --- ② CLOSED 選挙（結果確認用） ---
        Election closedElection = Election.builder()
                .code("SANGIIN-TEST-CLOSED-TOKYO-MACHIDA")
                .name("【テスト】集計結果確認用選挙（CLOSED）")
                .description("結果画面の確認用のテスト選挙です。")
                .district(machida1)
                .startsAt(now.minusDays(3))
                .endsAt(now.minusDays(1))
                .status(ElectionStatus.CLOSED)
                .build();

        openElection = electionRepository.save(openElection);
        closedElection = electionRepository.save(closedElection);

        // --- 候補者 ---
        List<Candidate> candidates = new ArrayList<>();

        // OPEN 用候補者
        candidates.add(Candidate.builder()
                .name("山田 一郎")
                .partyName("テスト党A")
                .profile("オンライン投票テスト用候補者A")
                .displayOrder(1)
                .election(openElection)
                .build());

        candidates.add(Candidate.builder()
                .name("佐藤 二郎")
                .partyName("テスト党B")
                .profile("オンライン投票テスト用候補者B")
                .displayOrder(2)
                .election(openElection)
                .build());

        candidates.add(Candidate.builder()
                .name("高橋 三郎")
                .partyName("テスト党C")
                .profile("オンライン投票テスト用候補者C")
                .displayOrder(3)
                .election(openElection)
                .build());

        // CLOSED 用候補者
        Candidate rc1 = Candidate.builder()
                .name("結果 太郎")
                .partyName("結果確認党")
                .profile("結果画面用候補者1")
                .displayOrder(1)
                .election(closedElection)
                .build();
        Candidate rc2 = Candidate.builder()
                .name("結果 花子")
                .partyName("結果確認党")
                .profile("結果画面用候補者2")
                .displayOrder(2)
                .election(closedElection)
                .build();
        Candidate rc3 = Candidate.builder()
                .name("結果 三郎")
                .partyName("結果確認党")
                .profile("結果画面用候補者3")
                .displayOrder(3)
                .election(closedElection)
                .build();

        candidates.add(rc1);
        candidates.add(rc2);
        candidates.add(rc3);

        candidateRepository.saveAll(candidates);

        // --- CLOSED 選挙にダミー投票を投入 ---
        List<VoterAccount> voters = accounts;
        if (voters.isEmpty() || demoVoter == null) {
            return;
        }

        LocalDateTime baseTime = now.minusDays(1);

        // 1) デモ用有権者（CITIZEN-000001 相当）に履歴3件
        Vote v1 = Vote.builder()
                .election(closedElection)
                .voterAccount(demoVoter)
                .candidate(rc1)
                .status(VoteStatus.ACTIVE)
                .votedAt(baseTime.minusHours(2))
                .build();
        voteRepository.save(v1);

        Vote v2 = Vote.builder()
                .election(closedElection)
                .voterAccount(demoVoter)
                .candidate(rc2)
                .status(VoteStatus.ACTIVE)
                .votedAt(baseTime.minusHours(1))
                .build();
        voteRepository.save(v2);

        Vote v3 = Vote.builder()
                .election(closedElection)
                .voterAccount(demoVoter)
                .candidate(rc3)
                .status(VoteStatus.ACTIVE)
                .votedAt(baseTime.minusMinutes(30))
                .build();
        voteRepository.save(v3);

        // 2) 残りの有権者にも1票ずつ入れて、結果をそれっぽくする
        int idx = 0;
        for (VoterAccount voter : voters) {
            if (voter.getId().equals(demoVoter.getId())) {
                continue; // さっき履歴入れた人はスキップ
            }

            Candidate chosen;
            int mod = idx % 3;
            if (mod == 0) {
                chosen = rc1;
            } else if (mod == 1) {
                chosen = rc2;
            } else {
                chosen = rc3;
            }

            Vote vote = Vote.builder()
                    .election(closedElection)
                    .voterAccount(voter)
                    .candidate(chosen)
                    .status(VoteStatus.ACTIVE)
                    .votedAt(baseTime.plusMinutes(idx))
                    .build();

            voteRepository.save(vote);
            idx++;

            if (idx >= 50) {
                break; // テスト用なので50票で打ち切り
            }
        }
    }
}
