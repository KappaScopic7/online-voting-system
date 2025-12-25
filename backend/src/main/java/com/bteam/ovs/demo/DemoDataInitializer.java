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
import com.bteam.ovs.voter.domain.VoterStatus;
import com.bteam.ovs.voter.repository.VoterAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final PasswordEncoder passwordEncoder;

    // --- 固定ログイン（開発用） ---
    private static final String PASS = "Passw0rd!";
    private static final String DEMO_HAS_EMAIL = "demo-has-election@example.com";
    private static final String DEMO_NO_EMAIL  = "demo-no-election@example.com";

    // --- District codes ---
    private static final String D_MACHIDA = "TOKYO-MACHIDA-01";
    private static final String D_OTHER   = "TOKYO-OTHER-01";

    // --- Election codes ---
    private static final String E_OPEN_CODE          = "SHUGIIN-OPEN-TOKYO-MACHIDA";
    private static final String E_CLOSED_VOTED_CODE  = "SANGIIN-CLOSED-TOKYO-MACHIDA";
    private static final String E_CLOSED_NOVOTE_CODE = "SANGIIN-CLOSED-TOKYO-MACHIDA-PAST";

    @Override
    public void run(String... args) {
        LocalDateTime now = LocalDateTime.now();

        long citizenCount = citizenRepository.count();
        long electionCount = electionRepository.count();

        if (citizenCount == 0 && electionCount == 0) {
            createAllDemoData(now);
        } else {
            refreshDemoElectionWindows(now);
        }
    }

    private void createAllDemoData(LocalDateTime now) {

        // --- Districts ---
        District machida1 = districtRepository.findByCode(D_MACHIDA)
                .orElseGet(() -> {
                    District d = new District();
                    d.setCode(D_MACHIDA);
                    d.setName("東京都 町田市 第1区");
                    d.setPrefecture("東京都");
                    d.setCity("町田市");
                    return districtRepository.save(d);
                });

        District otherDistrict = districtRepository.findByCode(D_OTHER)
                .orElseGet(() -> {
                    District d = new District();
                    d.setCode(D_OTHER);
                    d.setName("東京都 テスト市 第1区");
                    d.setPrefecture("東京都");
                    d.setCity("テスト市");
                    return districtRepository.save(d);
                });

        // --- Citizens ---
        // 30人作る（2人目だけ別地区にして「選挙なし」アカウントを再現）
        List<Citizen> citizens = new ArrayList<>();
        for (int i = 1; i <= 30; i++) {
            String pseudoMyNumber = "CIT-%08d".formatted(i);

            District districtForCitizen = (i == 2) ? otherDistrict : machida1;

            Citizen c = Citizen.builder()
                    .pseudoMyNumber(pseudoMyNumber)
                    .familyName(fakeFamilyName(i))
                    .givenName(fakeGivenName(i))
                    .prefecture("東京都")
                    .city(districtForCitizen.getCity())
                    .addressLine(fakeAddress(i))
                    .dateOfBirth(LocalDate.of(1975, 1, 1).plusDays(i * 37L))
                    .district(districtForCitizen)
                    .build();

            citizens.add(c);
        }
        citizens = citizenRepository.saveAll(citizens);

        // --- VoterAccounts ---
        List<VoterAccount> accounts = new ArrayList<>();
        VoterAccount demoVoterHasElection = null; // 町田1区
        VoterAccount demoVoterNoElection  = null; // 別地区

        for (int idx = 0; idx < citizens.size(); idx++) {
            Citizen citizen = citizens.get(idx);

            VoterAccount va = VoterAccount.builder()
                    .citizen(citizen)
                    .build();

            citizen.setVoterAccount(va);

            if (idx == 0) {
                demoVoterHasElection = va;
            } else if (idx == 1) {
                demoVoterNoElection = va;
            }

            accounts.add(va);
        }
        accounts = voterAccountRepository.saveAll(accounts);

        // 固定ログイン用（開発効率）
        if (demoVoterHasElection != null) {
            demoVoterHasElection.setEmail(DEMO_HAS_EMAIL);
            demoVoterHasElection.setPasswordHash(passwordEncoder.encode(PASS));
            demoVoterHasElection.setStatus(VoterStatus.ACTIVE);
            voterAccountRepository.save(demoVoterHasElection);
        }
        if (demoVoterNoElection != null) {
            demoVoterNoElection.setEmail(DEMO_NO_EMAIL);
            demoVoterNoElection.setPasswordHash(passwordEncoder.encode(PASS));
            demoVoterNoElection.setStatus(VoterStatus.ACTIVE);
            voterAccountRepository.save(demoVoterNoElection);
        }

        // --- Elections (3本) ---
        Election openElection = Election.builder()
                .code(E_OPEN_CODE)
                .name("衆議院 議員総選挙（町田市 第1区）")
                .description("投票期間中の選挙です。本人確認のうえ投票を行ってください。")
                .district(machida1)
                .startsAt(now.minusHours(2))
                .endsAt(now.plusHours(20))
                .status(ElectionStatus.OPEN)
                .build();

        Election closedElectionVoted = Election.builder()
                .code(E_CLOSED_VOTED_CODE)
                .name("参議院 通常選挙（町田市 第1区）")
                .description("投票は終了しています。投票履歴および開票結果を確認できます。")
                .district(machida1)
                .startsAt(now.minusDays(10))
                .endsAt(now.minusDays(7))
                .status(ElectionStatus.CLOSED)
                .build();

        Election closedElectionNoVote = Election.builder()
                .code(E_CLOSED_NOVOTE_CODE)
                .name("市長選挙（町田市）")
                .description("投票は終了しています。結果は閲覧できますが、投票していない場合は履歴に表示されません。")
                .district(machida1)
                .startsAt(now.minusDays(20))
                .endsAt(now.minusDays(17))
                .status(ElectionStatus.CLOSED)
                .build();

        openElection = electionRepository.save(openElection);
        closedElectionVoted = electionRepository.save(closedElectionVoted);
        closedElectionNoVote = electionRepository.save(closedElectionNoVote);

        // --- Candidates ---
        List<Candidate> candidates = new ArrayList<>();

        // OPEN（3名）
        candidates.add(Candidate.builder()
                .name("朝倉 恒一")
                .partyName("未来連合")
                .profile("地域産業の活性化と子育て支援の拡充を掲げる。")
                .displayOrder(1)
                .election(openElection)
                .build());

        candidates.add(Candidate.builder()
                .name("久保田 恒一郎")
                .partyName("生活改革党")
                .profile("医療・交通インフラの整備、行政手続の効率化を訴える。")
                .displayOrder(2)
                .election(openElection)
                .build());

        candidates.add(Candidate.builder()
                .name("成瀬 恒一")
                .partyName(null) // 無所属
                .profile("防災・防犯と地域コミュニティ支援を中心に活動。")
                .displayOrder(3)
                .election(openElection)
                .build());

        // CLOSED（投票済み）3名
        Candidate rc1 = Candidate.builder()
                .name("桐生 恒一")
                .partyName("公正フォーラム")
                .profile("教育投資と雇用創出を重点政策とする。")
                .displayOrder(1)
                .election(closedElectionVoted)
                .build();
        Candidate rc2 = Candidate.builder()
                .name("石田 恒一")
                .partyName("地域共創会")
                .profile("中小企業支援と行政サービスの質向上を掲げる。")
                .displayOrder(2)
                .election(closedElectionVoted)
                .build();
        Candidate rc3 = Candidate.builder()
                .name("西園寺 恒一")
                .partyName("国民バランス党")
                .profile("財政規律と生活支援の両立を主張。")
                .displayOrder(3)
                .election(closedElectionVoted)
                .build();
        candidates.add(rc1);
        candidates.add(rc2);
        candidates.add(rc3);

        // CLOSED（未投票）3名
        Candidate nv1 = Candidate.builder()
                .name("三上 恒一")
                .partyName("市民連帯")
                .profile("福祉の充実と地域医療の強化に取り組む。")
                .displayOrder(1)
                .election(closedElectionNoVote)
                .build();
        Candidate nv2 = Candidate.builder()
                .name("相原 恒一")
                .partyName("都市みらい会")
                .profile("公共交通の改善と都市計画の見直しを提案。")
                .displayOrder(2)
                .election(closedElectionNoVote)
                .build();
        Candidate nv3 = Candidate.builder()
                .name("宮本 恒一")
                .partyName(null)
                .profile("行政の透明性向上と情報公開の徹底を訴える。")
                .displayOrder(3)
                .election(closedElectionNoVote)
                .build();
        candidates.add(nv1);
        candidates.add(nv2);
        candidates.add(nv3);

        candidateRepository.saveAll(candidates);

        // --- Votes ---
        // 方針：
        //  - CLOSED(投票済み) は demoVoterHasElection が3回投票（最後の票だけACTIVEになる想定）
        //  - CLOSED(未投票) は demoVoterHasElection は投票しない、他の有権者のみ投票
        if (accounts.isEmpty() || demoVoterHasElection == null) return;

        LocalDateTime baseTime = now.minusDays(8);

        // demo（3回投票：最後がACTIVEになってほしいが、今の仕様は「古いのをCANCELEDにする」のはcastVote時だけ）
        // ここでは履歴用に3件すべてACTIVEで入れている。
        // もし「最後だけACTIVE」にしたいなら v1,v2 を CANCELED にする。
        Vote v1 = Vote.builder()
                .election(closedElectionVoted)
                .voterAccount(demoVoterHasElection)
                .candidate(rc1)
                .status(VoteStatus.CANCELED)
                .votedAt(baseTime.plusHours(1))
                .build();
        voteRepository.save(v1);

        Vote v2 = Vote.builder()
                .election(closedElectionVoted)
                .voterAccount(demoVoterHasElection)
                .candidate(rc2)
                .status(VoteStatus.CANCELED)
                .votedAt(baseTime.plusHours(2))
                .build();
        voteRepository.save(v2);

        Vote v3 = Vote.builder()
                .election(closedElectionVoted)
                .voterAccount(demoVoterHasElection)
                .candidate(rc3)
                .status(VoteStatus.ACTIVE) // 最終票だけ有効
                .votedAt(baseTime.plusHours(3))
                .build();
        voteRepository.save(v3);

        // 他の有権者の票（CLOSED投票済み）
        int idx = 0;
        for (VoterAccount voter : accounts) {
            if (voter.getId().equals(demoVoterHasElection.getId())) continue;

            Candidate chosen = switch (idx % 3) {
                case 0 -> rc1;
                case 1 -> rc2;
                default -> rc3;
            };

            voteRepository.save(Vote.builder()
                    .election(closedElectionVoted)
                    .voterAccount(voter)
                    .candidate(chosen)
                    .status(VoteStatus.ACTIVE)
                    .votedAt(baseTime.plusMinutes(10L + idx))
                    .build());

            idx++;
            if (idx >= 80) break;
        }

        // CLOSED（未投票）：demoVoterHasElection は投票させない
        LocalDateTime baseTime2 = now.minusDays(18);
        int idxNoVote = 0;
        for (VoterAccount voter : accounts) {
            if (voter.getId().equals(demoVoterHasElection.getId())) continue;

            Candidate chosen = switch (idxNoVote % 3) {
                case 0 -> nv1;
                case 1 -> nv2;
                default -> nv3;
            };

            voteRepository.save(Vote.builder()
                    .election(closedElectionNoVote)
                    .voterAccount(voter)
                    .candidate(chosen)
                    .status(VoteStatus.ACTIVE)
                    .votedAt(baseTime2.plusMinutes(15L + idxNoVote))
                    .build());

            idxNoVote++;
            if (idxNoVote >= 60) break;
        }
    }

    private void refreshDemoElectionWindows(LocalDateTime now) {

        // OPENは「常に今投票できる」状態に調整
        electionRepository.findByCode(E_OPEN_CODE)
                .ifPresent(e -> {
                    e.setStartsAt(now.minusHours(2));
                    e.setEndsAt(now.plusHours(20));
                    e.setStatus(ElectionStatus.OPEN);
                    electionRepository.save(e);
                });

        // CLOSED（投票済み）/（未投票）は締切済みに固定
        electionRepository.findByCode(E_CLOSED_VOTED_CODE)
                .ifPresent(e -> {
                    e.setStartsAt(now.minusDays(10));
                    e.setEndsAt(now.minusDays(7));
                    e.setStatus(ElectionStatus.CLOSED);
                    electionRepository.save(e);
                });

        electionRepository.findByCode(E_CLOSED_NOVOTE_CODE)
                .ifPresent(e -> {
                    e.setStartsAt(now.minusDays(20));
                    e.setEndsAt(now.minusDays(17));
                    e.setStatus(ElectionStatus.CLOSED);
                    electionRepository.save(e);
                });
    }

    // ====== “それっぽい”個人情報ジェネレータ（完全架空） ======

    private static String fakeFamilyName(int i) {
        String[] names = {"佐々木", "高橋", "伊藤", "田中", "小林", "斎藤", "森", "山本", "石井", "阿部"};
        return names[(i - 1) % names.length];
    }

    private static String fakeGivenName(int i) {
        String[] names = {"健太", "結衣", "陽菜", "翔太", "美咲", "直樹", "葵", "航", "真由", "大輝"};
        return names[(i - 1) % names.length] + i; // 同名回避で末尾に番号
    }

    private static String fakeAddress(int i) {
        // 町丁名っぽくする（実在住所の再現は避ける）
        int chome = ((i - 1) % 5) + 1;
        int ban = ((i * 7) % 20) + 1;
        return "緑町" + chome + "-" + ban;
    }
}
