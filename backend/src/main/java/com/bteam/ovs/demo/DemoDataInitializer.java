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

        District machida1 = districtRepository.findByCode("TOKYO-MACHIDA-01")
            .orElseGet(() -> {
                District d = new District();
                d.setCode("TOKYO-MACHIDA-01");
                d.setName("東京都町田市第1区");
                d.setPrefecture("東京都");
                d.setCity("町田市");
                return districtRepository.save(d);
            });

        District otherDistrict = districtRepository.findByCode("TOKYO-OTHER-01")
            .orElseGet(() -> {
                District d = new District();
                d.setCode("TOKYO-OTHER-01");
                d.setName("テスト用別地区（選挙なし）");
                d.setPrefecture("東京都");
                d.setCity("テスト市");
                return districtRepository.save(d);
            });

        List<Citizen> citizens = new ArrayList<>();
        for (int i = 1; i <= 30; i++) {
            String pseudoMyNumber = "CITIZEN-%06d".formatted(i);

            District districtForCitizen =
                    (i == 2) ? otherDistrict : machida1;

            Citizen c = Citizen.builder()
                    .pseudoMyNumber(pseudoMyNumber)
                    .familyName("山田")
                    .givenName("太郎" + i)
                    .prefecture("東京都")
                    .city(districtForCitizen.getCity())
                    .addressLine("テスト" + i + "丁目")
                    .dateOfBirth(LocalDate.of(1990, 1, 1).plusDays(i))
                    .district(districtForCitizen)
                    .build();

            citizens.add(c);
        }
        citizens = citizenRepository.saveAll(citizens);

        List<VoterAccount> accounts = new ArrayList<>();
        VoterAccount demoVoterHasElection = null;
        VoterAccount demoVoterNoElection = null;

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

        if (demoVoterHasElection != null) {
            demoVoterHasElection.setEmail("demo-has-election@example.com");
            demoVoterHasElection.setPasswordHash(passwordEncoder.encode("Passw0rd!"));
            demoVoterHasElection.setStatus(VoterStatus.ACTIVE);
            voterAccountRepository.save(demoVoterHasElection);
        }

        if (demoVoterNoElection != null) {
            demoVoterNoElection.setEmail("demo-no-election@example.com");
            demoVoterNoElection.setPasswordHash(passwordEncoder.encode("Passw0rd!"));
            demoVoterNoElection.setStatus(VoterStatus.ACTIVE);
            voterAccountRepository.save(demoVoterNoElection);
        }

        Election openElection = Election.builder()
                .code("SHUGIIN-TEST-OPEN-TOKYO-MACHIDA")
                .name("【テスト】オンライン投票テスト用選挙（OPEN）")
                .description("いま投票できるテスト用の選挙です。")
                .district(machida1)
                .startsAt(now.minusHours(1))
                .endsAt(now.plusDays(1))
                .status(ElectionStatus.OPEN)
                .build();

        Election closedElectionVoted = Election.builder()
                .code("SANGIIN-TEST-CLOSED-TOKYO-MACHIDA")
                .name("【テスト】集計結果確認用選挙（CLOSED・自分は投票済み）")
                .description("結果画面＆自分の投票履歴確認用のテスト選挙です。")
                .district(machida1)
                .startsAt(now.minusDays(3))
                .endsAt(now.minusDays(1))
                .status(ElectionStatus.CLOSED)
                .build();

        Election closedElectionNoVote = Election.builder()
                .code("SANGIIN-TEST-CLOSED-NOVOTE-TOKYO-MACHIDA")
                .name("【テスト】未投票パターン確認用選挙（CLOSED・自分は未投票）")
                .description("他の有権者には票があるが、自分は投票していないケース。")
                .district(machida1)
                .startsAt(now.minusDays(5))
                .endsAt(now.minusDays(2))
                .status(ElectionStatus.CLOSED)
                .build();

        openElection           = electionRepository.save(openElection);
        closedElectionVoted    = electionRepository.save(closedElectionVoted);
        closedElectionNoVote   = electionRepository.save(closedElectionNoVote);

        List<Candidate> candidates = new ArrayList<>();

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

        Candidate rc1 = Candidate.builder()
                .name("結果 太郎")
                .partyName("結果確認党")
                .profile("結果画面用候補者1")
                .displayOrder(1)
                .election(closedElectionVoted)
                .build();
        Candidate rc2 = Candidate.builder()
                .name("結果 花子")
                .partyName("結果確認党")
                .profile("結果画面用候補者2")
                .displayOrder(2)
                .election(closedElectionVoted)
                .build();
        Candidate rc3 = Candidate.builder()
                .name("結果 三郎")
                .partyName("結果確認党")
                .profile("結果画面用候補者3")
                .displayOrder(3)
                .election(closedElectionVoted)
                .build();

        candidates.add(rc1);
        candidates.add(rc2);
        candidates.add(rc3);

        Candidate nv1 = Candidate.builder()
                .name("未投票 太郎")
                .partyName("未投票確認党")
                .profile("未投票ケース確認用候補者1")
                .displayOrder(1)
                .election(closedElectionNoVote)
                .build();
        Candidate nv2 = Candidate.builder()
                .name("未投票 花子")
                .partyName("未投票確認党")
                .profile("未投票ケース確認用候補者2")
                .displayOrder(2)
                .election(closedElectionNoVote)
                .build();
        Candidate nv3 = Candidate.builder()
                .name("未投票 三郎")
                .partyName("未投票確認党")
                .profile("未投票ケース確認用候補者3")
                .displayOrder(3)
                .election(closedElectionNoVote)
                .build();

        candidates.add(nv1);
        candidates.add(nv2);
        candidates.add(nv3);

        candidateRepository.saveAll(candidates);

        List<VoterAccount> voters = accounts;
        if (voters.isEmpty() || demoVoterHasElection == null) {
            return;
        }

        LocalDateTime baseTime = now.minusDays(1);

        Vote v1 = Vote.builder()
                .election(closedElectionVoted)
                .voterAccount(demoVoterHasElection)
                .candidate(rc1)
                .status(VoteStatus.ACTIVE)
                .votedAt(baseTime.minusHours(2))
                .build();
        voteRepository.save(v1);

        Vote v2 = Vote.builder()
                .election(closedElectionVoted)
                .voterAccount(demoVoterHasElection)
                .candidate(rc2)
                .status(VoteStatus.ACTIVE)
                .votedAt(baseTime.minusHours(1))
                .build();
        voteRepository.save(v2);

        Vote v3 = Vote.builder()
                .election(closedElectionVoted)
                .voterAccount(demoVoterHasElection)
                .candidate(rc3)
                .status(VoteStatus.ACTIVE)
                .votedAt(baseTime.minusMinutes(30))
                .build();
        voteRepository.save(v3);

        int idx = 0;
        for (VoterAccount voter : voters) {
            if (voter.getId().equals(demoVoterHasElection.getId())) {
                continue;
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
                    .election(closedElectionVoted)
                    .voterAccount(voter)
                    .candidate(chosen)
                    .status(VoteStatus.ACTIVE)
                    .votedAt(baseTime.plusMinutes(idx))
                    .build();

            voteRepository.save(vote);
            idx++;

            if (idx >= 50) {
                break;
            }
        }

        int idxNoVote = 0;
        for (VoterAccount voter : voters) {
            if (voter.getId().equals(demoVoterHasElection.getId())) {
                continue;
            }

            Candidate chosen;
            int mod = idxNoVote % 3;
            if (mod == 0) {
                chosen = nv1;
            } else if (mod == 1) {
                chosen = nv2;
            } else {
                chosen = nv3;
            }

            Vote vote = Vote.builder()
                    .election(closedElectionNoVote)
                    .voterAccount(voter)
                    .candidate(chosen)
                    .status(VoteStatus.ACTIVE)
                    .votedAt(baseTime.minusHours(5).plusMinutes(idxNoVote))
                    .build();

            voteRepository.save(vote);
            idxNoVote++;

            if (idxNoVote >= 50) {
                break;
            }
        }
    }

    private void refreshDemoElectionWindows(LocalDateTime now) {

        electionRepository.findByCode("SHUGIIN-TEST-OPEN-TOKYO-MACHIDA")
                .ifPresent(e -> {
                    e.setStartsAt(now.minusHours(1));
                    e.setEndsAt(now.plusDays(1));
                    e.setStatus(ElectionStatus.OPEN);
                    electionRepository.save(e);
                });

        electionRepository.findByCode("SANGIIN-TEST-CLOSED-TOKYO-MACHIDA")
                .ifPresent(e -> {
                    e.setStartsAt(now.minusDays(3));
                    e.setEndsAt(now.minusDays(1));
                    e.setStatus(ElectionStatus.CLOSED);
                    electionRepository.save(e);
                });

        electionRepository.findByCode("SANGIIN-TEST-CLOSED-NOVOTE-TOKYO-MACHIDA")
                .ifPresent(e -> {
                    e.setStartsAt(now.minusDays(5));
                    e.setEndsAt(now.minusDays(2));
                    e.setStatus(ElectionStatus.CLOSED);
                    electionRepository.save(e);
                });
    }
}
