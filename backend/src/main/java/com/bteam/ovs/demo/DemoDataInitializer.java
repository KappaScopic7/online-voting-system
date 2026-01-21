package com.bteam.ovs.demo;

import com.bteam.ovs.auth.model.Role;
import com.bteam.ovs.auth.model.StaffAccount;
import com.bteam.ovs.auth.model.UserAccount;
import com.bteam.ovs.auth.repo.StaffAccountRepository;
import com.bteam.ovs.auth.repo.UserAccountRepository;
import com.bteam.ovs.elections.model.Candidate;
import com.bteam.ovs.elections.model.Election;
import com.bteam.ovs.elections.repo.CandidateRepository;
import com.bteam.ovs.elections.repo.ElectionRepository;
import com.bteam.ovs.voting.model.VoteCast;
import com.bteam.ovs.voting.model.VoteCurrent;
import com.bteam.ovs.voting.repo.VoteCastRepository;
import com.bteam.ovs.voting.repo.VoteCurrentRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Profile("demo")
@Configuration
public class DemoDataInitializer {

    private static final String DEMO_ELECTION_PREFIX = "デモ選挙";

    private static final String DEMO_VOTER_EMAIL = "0@example.com";
    private static final String DEMO_VOTER_PASSWORD = "Passw0rd!!";

    private static final String DEMO_ADMIN_LOGIN_ID = "admin";
    private static final String DEMO_ADMIN_PASSWORD = "Passw0rd!!";

    private static final String DEMO_COMMITTEE_LOGIN_ID = "committee";
    private static final String DEMO_COMMITTEE_PASSWORD = "Passw0rd!!";

    @Bean
    CommandLineRunner demoInit(
            UserAccountRepository userRepo,
            StaffAccountRepository staffRepo,
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            VoteCastRepository voteCastRepo,
            VoteCurrentRepository voteCurrentRepo,
            PasswordEncoder passwordEncoder,
            TransactionTemplate tx
    ) {
        return args -> tx.executeWithoutResult(status ->
                init(userRepo, staffRepo, electionRepo, candidateRepo, voteCastRepo, voteCurrentRepo, passwordEncoder)
        );
    }

    void init(
            UserAccountRepository userRepo,
            StaffAccountRepository staffRepo,
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            VoteCastRepository voteCastRepo,
            VoteCurrentRepository voteCurrentRepo,
            PasswordEncoder passwordEncoder
    ) {
        seedAdmin(staffRepo, passwordEncoder);
        seedCommittee(staffRepo, passwordEncoder);

        UUID citizenId = seedVoter(userRepo, passwordEncoder);

        seedElectionsAndVotes(electionRepo, candidateRepo, voteCastRepo, voteCurrentRepo, citizenId);
    }

    // =========================
    // seed staff / user
    // =========================

    private void seedAdmin(
            StaffAccountRepository staffRepo,
            PasswordEncoder passwordEncoder
    ) {
        if (staffRepo.existsByLoginId(DEMO_ADMIN_LOGIN_ID)) {
            return;
        }

        var admin = new StaffAccount();
        admin.setLoginId(DEMO_ADMIN_LOGIN_ID);
        admin.setPasswordHash(passwordEncoder.encode(DEMO_ADMIN_PASSWORD));
        admin.setRole(Role.ADMIN);
        admin.setEnabled(true);
        admin.setLocked(false);

        staffRepo.save(admin);
    }

    private void seedCommittee(
            StaffAccountRepository staffRepo,
            PasswordEncoder passwordEncoder
    ) {
        if (staffRepo.existsByLoginId(DEMO_COMMITTEE_LOGIN_ID)) {
            return;
        }

        var committee = new StaffAccount();
        committee.setLoginId(DEMO_COMMITTEE_LOGIN_ID);
        committee.setPasswordHash(passwordEncoder.encode(DEMO_COMMITTEE_PASSWORD));
        committee.setRole(Role.COMMITTEE);
        committee.setEnabled(true);
        committee.setLocked(false);

        staffRepo.save(committee);
    }

    private UUID seedVoter(UserAccountRepository userRepo, PasswordEncoder passwordEncoder) {
        var opt = userRepo.findByEmail(DEMO_VOTER_EMAIL);

        if (opt.isPresent()) {
            var acc = opt.get();

            // もし citizenId が無ければ付与して VOTER にする（デモなので強制昇格OK）
            if (acc.getCitizenId() == null) {
                acc.setCitizenId(UUID.randomUUID());
            }
            acc.setRole(Role.VOTER);
            acc.setEmailVerified(true);
            acc.setEnabled(true);
            acc.setLocked(false);
            if (acc.getPasswordHash() == null || acc.getPasswordHash().isBlank()) {
                acc.setPasswordHash(passwordEncoder.encode(DEMO_VOTER_PASSWORD));
            }

            userRepo.save(acc);
            return acc.getCitizenId();
        }

        UUID citizenId = UUID.randomUUID();
        var voter = new UserAccount();
        voter.setEmail(DEMO_VOTER_EMAIL);
        voter.setPasswordHash(passwordEncoder.encode(DEMO_VOTER_PASSWORD));
        voter.setRole(Role.VOTER);
        voter.setEnabled(true);
        voter.setLocked(false);
        voter.setEmailVerified(true);
        voter.setCitizenId(citizenId);

        userRepo.save(voter);
        return citizenId;
    }

    // =========================
    // seed elections / candidates / votes
    // =========================

    private void seedElectionsAndVotes(
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            VoteCastRepository voteCastRepo,
            VoteCurrentRepository voteCurrentRepo,
            UUID citizenId
    ) {
        // 既存デモ選挙を削除（前回分を掃除）
        electionRepo.deleteByTitleStartingWith(DEMO_ELECTION_PREFIX);

        var now = Instant.now();
        String today = LocalDate.now().toString();

        // 1) 開催前（startsAt が未来）
        createElectionWithCandidates(
                electionRepo, candidateRepo,
                DEMO_ELECTION_PREFIX + " 開催前 " + today,
                now.plusSeconds(60 * 60),          // starts +1h
                now.plusSeconds(60 * 60 * 25),     // ends +25h
                "開催前"
        );

        // 2) 投票可能（開催中）
        createElectionWithCandidates(
                electionRepo, candidateRepo,
                DEMO_ELECTION_PREFIX + " 投票可能 " + today,
                now.minusSeconds(60 * 60),         // started -1h
                now.plusSeconds(60 * 60 * 24),     // ends +24h
                "投票可能"
        );

        // 3) 終了済み（投票済み）
        var endedVoted = createElectionWithCandidates(
                electionRepo, candidateRepo,
                DEMO_ELECTION_PREFIX + " 終了済み_投票済み " + today,
                now.minusSeconds(60 * 60 * 48),    // started -48h
                now.minusSeconds(60 * 60 * 24),    // ended -24h
                "終了済み投票済み"
        );

        // endedVoted の候補Aに投票したことにする
        UUID votedCandidateId = endedVoted.candidateIds().get(0);

        // 終了前に投票したことにする（終了後だと不自然なので endedAt より前）
        Instant votedAt = now.minusSeconds(60 * 60 * 25); // ended(-24h) より前

        seedVoteCast(voteCastRepo, endedVoted.electionId(), citizenId, votedCandidateId, votedAt);
        seedVoteCurrent(voteCurrentRepo, endedVoted.electionId(), citizenId, votedCandidateId, votedAt);

        // 4) 終了済み（未投票）
        createElectionWithCandidates(
                electionRepo, candidateRepo,
                DEMO_ELECTION_PREFIX + " 終了済み_未投票 " + today,
                now.minusSeconds(60 * 60 * 72),    // started -72h
                now.minusSeconds(60 * 60 * 48),    // ended -48h
                "終了済み未投票"
        );
    }

    private record CreatedElection(UUID electionId, List<UUID> candidateIds) {}

    private CreatedElection createElectionWithCandidates(
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            String title,
            Instant startsAt,
            Instant endsAt,
            String suffix
    ) {
        var election = new Election();
        election.setTitle(title);
        election.setStartsAt(startsAt);
        election.setEndsAt(endsAt);

        electionRepo.save(election);

        var candidateIds = createCandidates(candidateRepo, election.getId(),
                List.of("候補A_" + suffix, "候補B_" + suffix, "候補C_" + suffix));

        return new CreatedElection(election.getId(), candidateIds);
    }

    private List<UUID> createCandidates(
            CandidateRepository candidateRepo,
            UUID electionId,
            List<String> names
    ) {
        return names.stream().map(name -> {
            var c = new Candidate();
            c.setElectionId(electionId);
            c.setName(name);
            c = candidateRepo.save(c);
            return c.getId();
        }).toList();
    }

    private void seedVoteCast(
            VoteCastRepository voteCastRepo,
            UUID electionId,
            UUID citizenId,
            UUID candidateId,
            Instant castedAt
    ) {
        var v = new VoteCast();
        v.setElectionId(electionId);
        v.setCitizenId(citizenId);
        v.setCandidateId(candidateId);
        v.setCastedAt(castedAt);
        voteCastRepo.save(v);
    }

    private void seedVoteCurrent(
            VoteCurrentRepository voteCurrentRepo,
            UUID electionId,
            UUID citizenId,
            UUID candidateId,
            Instant castedAt
    ) {
        var v = new VoteCurrent();
        v.setElectionId(electionId);
        v.setCitizenId(citizenId);
        v.setCandidateId(candidateId);
        v.setCastedAt(castedAt);
        voteCurrentRepo.save(v);
    }
}
