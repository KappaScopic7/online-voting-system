package com.bteam.ovs.demo;

import com.bteam.ovs.auth.model.CommitteeAccount;
import com.bteam.ovs.auth.model.PortalAccount;
import com.bteam.ovs.auth.model.Role;
import com.bteam.ovs.auth.repo.CommitteeAccountRepository;
import com.bteam.ovs.auth.repo.PortalAccountRepository;
import com.bteam.ovs.elections.model.Candidate;
import com.bteam.ovs.elections.model.Election;
import com.bteam.ovs.elections.repo.CandidateRepository;
import com.bteam.ovs.elections.repo.ElectionRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Profile("demo")
@Configuration
public class DemoDataInitializer {

    private static final String DEMO_ELECTION_PREFIX = "デモ選挙 ";

    private static final String DEMO_VOTER_EMAIL = "test@example.com";
    private static final String DEMO_VOTER_PASSWORD = "Passw0rd!!";

    private static final String DEMO_ADMIN_LOGIN_ID = "admin";
    private static final String DEMO_ADMIN_PASSWORD = "Admin123!";

    @Bean
    CommandLineRunner demoInit(
            PortalAccountRepository portalRepo,
            CommitteeAccountRepository committeeRepo,
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            PasswordEncoder passwordEncoder,
            TransactionTemplate tx
    ) {
        return args -> tx.executeWithoutResult(status ->
                init(portalRepo, committeeRepo, electionRepo, candidateRepo, passwordEncoder)
        );
    }

    void init(
            PortalAccountRepository portalRepo,
            CommitteeAccountRepository committeeRepo,
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            PasswordEncoder passwordEncoder
    ) {
        System.out.println("""
            [DEMO] DemoDataInitializer start
            - profile: demo
            - seed: voter / admin / election
            """);

        seedAdmin(committeeRepo, passwordEncoder);
        seedVoter(portalRepo, passwordEncoder);
        seedElection(electionRepo, candidateRepo);

        System.out.println("[DEMO] DemoDataInitializer end");
    }

    // ======================
    // Admin (CommitteeAccount)
    // ======================
    private void seedAdmin(
            CommitteeAccountRepository committeeRepo,
            PasswordEncoder passwordEncoder
    ) {
        if (committeeRepo.existsByLoginId(DEMO_ADMIN_LOGIN_ID)) {
            System.out.println("[DEMO] Admin already exists: " + DEMO_ADMIN_LOGIN_ID);
            return;
        }

        var admin = new CommitteeAccount();
        admin.setLoginId(DEMO_ADMIN_LOGIN_ID);
        admin.setPasswordHash(passwordEncoder.encode(DEMO_ADMIN_PASSWORD));
        admin.setRole(Role.ADMIN);
        admin.setEnabled(true);
        admin.setLocked(false);

        committeeRepo.save(admin);

        System.out.println("""
            [DEMO] Admin created
              loginId : admin
              password: Admin123!
            """);
    }

    // ======================
    // Voter (PortalAccount)
    // ======================
    private UUID seedVoter(
            PortalAccountRepository portalRepo,
            PasswordEncoder passwordEncoder
    ) {
        var email = DEMO_VOTER_EMAIL;

        var existing = portalRepo.findByEmail(email);
        if (existing.isPresent()) {
            System.out.println("[DEMO] Voter already exists: " + email);
            return existing.get().getCitizenId();
        }

        UUID citizenId = UUID.randomUUID();

        var voter = new PortalAccount();
        voter.setEmail(email);
        voter.setPasswordHash(passwordEncoder.encode(DEMO_VOTER_PASSWORD));
        voter.setRole(Role.VOTER);
        voter.setEnabled(true);
        voter.setLocked(false);
        voter.setEmailVerified(true);
        voter.setCitizenId(citizenId);

        portalRepo.save(voter);

        System.out.println("""
            [DEMO] Voter created
              email    : test@example.com
              password : Passw0rd!!
              citizenId: %s
            """.formatted(citizenId));

        return citizenId;
    }

    // ======================
    // Election + Candidates
    // ======================
    private void seedElection(
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo
    ) {
        int deleted = electionRepo.deleteByTitleStartingWith(DEMO_ELECTION_PREFIX);
        if (deleted > 0) {
            System.out.println("[DEMO] Deleted demo elections: " + deleted);
        }

        var now = Instant.now();
        String title = DEMO_ELECTION_PREFIX + LocalDate.now() + " " + now;

        var election = new Election();
        election.setTitle(title);
        election.setStartsAt(now.minusSeconds(60));
        election.setEndsAt(now.plusSeconds(60 * 60 * 24));

        electionRepo.save(election);

        createCandidates(candidateRepo, election.getId(),
                List.of("候補A", "候補B", "候補C"));

        System.out.println("[DEMO] Election created: " + election.getId());
    }

    private void createCandidates(
            CandidateRepository candidateRepo,
            UUID electionId,
            List<String> names
    ) {
        for (var name : names) {
            var c = new Candidate();
            c.setElectionId(electionId);
            c.setName(name);
            candidateRepo.save(c);
        }
    }
}
