package com.bteam.ovs.demo;

import com.bteam.ovs.auth.repository.StaffAccountRepository;
import com.bteam.ovs.auth.repository.UserAccountRepository;
import com.bteam.ovs.candidates.repository.CandidateRepository;
import com.bteam.ovs.citizen.repository.CitizenRepository;
import com.bteam.ovs.elections.repository.ElectionEligibilityRuleRepository;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.parties.repository.PartyRepository;
import com.bteam.ovs.voting.repository.*;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Profile({ "dev", "prodlike" })
@Service
public class DemoDataService {

    private final DemoDataInitializer initializer;

    private final UserAccountRepository userRepo;
    private final StaffAccountRepository staffRepo;

    private final PartyRepository partyRepo;
    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;
    private final ElectionEligibilityRuleRepository ruleRepo;

    private final VoteCastRepository voteCastRepo;
    private final VoteCurrentRepository voteCurrentRepo;
    private final VoteAllocCastRepository voteAllocCastRepo;
    private final VoteAllocCurrentRepository voteAllocCurrentRepo;
    private final VoteAllocItemRepository voteAllocItemRepo;

    private final JudgeReviewCastRepository judgeReviewCastRepo;
    private final JudgeReviewItemRepository judgeReviewItemRepo;

    private final CitizenRepository citizenRepo;

    private final PasswordEncoder passwordEncoder;
    private final TransactionTemplate tx;

    public DemoDataService(
            DemoDataInitializer initializer,
            UserAccountRepository userRepo,
            StaffAccountRepository staffRepo,
            PartyRepository partyRepo,
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            ElectionEligibilityRuleRepository ruleRepo,
            VoteCastRepository voteCastRepo,
            VoteCurrentRepository voteCurrentRepo,
            VoteAllocCastRepository voteAllocCastRepo,
            VoteAllocCurrentRepository voteAllocCurrentRepo,
            VoteAllocItemRepository voteAllocItemRepo,

            JudgeReviewCastRepository judgeReviewCastRepo,
            JudgeReviewItemRepository judgeReviewItemRepo,

            CitizenRepository citizenRepo,
            PasswordEncoder passwordEncoder,
            TransactionTemplate tx) {

        this.initializer = initializer;
        this.userRepo = userRepo;
        this.staffRepo = staffRepo;
        this.partyRepo = partyRepo;
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
        this.ruleRepo = ruleRepo;
        this.voteCastRepo = voteCastRepo;
        this.voteCurrentRepo = voteCurrentRepo;
        this.voteAllocCastRepo = voteAllocCastRepo;
        this.voteAllocCurrentRepo = voteAllocCurrentRepo;
        this.voteAllocItemRepo = voteAllocItemRepo;

        this.judgeReviewCastRepo = judgeReviewCastRepo;
        this.judgeReviewItemRepo = judgeReviewItemRepo;

        this.citizenRepo = citizenRepo;
        this.passwordEncoder = passwordEncoder;
        this.tx = tx;
    }

    public void resetAndSeed() {
        tx.executeWithoutResult(status -> {
            wipeAll();
            initializer.init(
                    userRepo, staffRepo,
                    partyRepo, electionRepo, candidateRepo, ruleRepo,
                    voteCastRepo, voteCurrentRepo,
                    voteAllocCastRepo, voteAllocCurrentRepo, voteAllocItemRepo,

                    judgeReviewCastRepo, judgeReviewItemRepo,

                    citizenRepo,
                    passwordEncoder);
        });
    }

    private void wipeAll() {
        judgeReviewItemRepo.deleteAll();
        judgeReviewCastRepo.deleteAll();

        voteAllocCurrentRepo.deleteAll();
        voteAllocItemRepo.deleteAll();
        voteAllocCastRepo.deleteAll();

        voteCurrentRepo.deleteAll();
        voteCastRepo.deleteAll();

        ruleRepo.deleteAll();
        candidateRepo.deleteAll();
        electionRepo.deleteAll();
        partyRepo.deleteAll();

        userRepo.deleteAll();
        staffRepo.deleteAll();
        citizenRepo.deleteAll();
    }
}
