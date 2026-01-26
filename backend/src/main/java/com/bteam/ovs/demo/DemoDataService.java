package com.bteam.ovs.demo;

import com.bteam.ovs.auth.repository.StaffAccountRepository;
import com.bteam.ovs.auth.repository.UserAccountRepository;
import com.bteam.ovs.citizen.repository.CitizenRepository;
import com.bteam.ovs.elections.repository.CandidateRepository;
import com.bteam.ovs.elections.repository.ElectionEligibilityRuleRepository;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.voting.repository.VoteCastRepository;
import com.bteam.ovs.voting.repository.VoteCurrentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Profile("demo")
@Service
public class DemoDataService {

    private final DemoDataInitializer initializer;

    private final UserAccountRepository userRepo;
    private final StaffAccountRepository staffRepo;
    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;
    private final VoteCastRepository voteCastRepo;
    private final VoteCurrentRepository voteCurrentRepo;
    private final CitizenRepository citizenRepo;
    private final ElectionEligibilityRuleRepository ruleRepo;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate tx;

    public DemoDataService(
            DemoDataInitializer initializer,
            UserAccountRepository userRepo,
            StaffAccountRepository staffRepo,
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            VoteCastRepository voteCastRepo,
            VoteCurrentRepository voteCurrentRepo,
            CitizenRepository citizenRepo,
            ElectionEligibilityRuleRepository ruleRepo,
            PasswordEncoder passwordEncoder,
            ObjectMapper objectMapper,
            TransactionTemplate tx
    ) {
        this.initializer = initializer;
        this.userRepo = userRepo;
        this.staffRepo = staffRepo;
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
        this.voteCastRepo = voteCastRepo;
        this.voteCurrentRepo = voteCurrentRepo;
        this.citizenRepo = citizenRepo;
        this.ruleRepo = ruleRepo;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
        this.tx = tx;
    }

    public void resetAndSeed() {
        tx.executeWithoutResult(status -> {
            wipeAll();
            // 既存 init をそのまま再利用（JSON seed）
            initializer.init(
                    userRepo, staffRepo,
                    electionRepo, candidateRepo,
                    voteCastRepo, voteCurrentRepo,
                    citizenRepo, ruleRepo,
                    passwordEncoder, objectMapper
            );
        });
    }

    private void wipeAll() {
        voteCurrentRepo.deleteAll();
        voteCastRepo.deleteAll();

        candidateRepo.deleteAll();
        ruleRepo.deleteAll();
        electionRepo.deleteAll();

        userRepo.deleteAll();
        staffRepo.deleteAll();
        citizenRepo.deleteAll();
    }
}
