package com.bteam.ovs.voters.voting;

import com.bteam.ovs.shared.security.PrincipalExtractor;
import com.bteam.ovs.shared.validation.UuidParsers;
import com.bteam.ovs.voting.controller.dto.JudgeReviewConfirmRequest;
import com.bteam.ovs.voting.controller.dto.JudgeReviewStartResponse;
import com.bteam.ovs.voting.service.VotingService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/public/judge-review")
public class PublicJudgeReviewController {

    private final VotingService votingService;

    public PublicJudgeReviewController(VotingService votingService) {
        this.votingService = votingService;
    }

    @GetMapping("/start")
    public JudgeReviewStartResponse start(
            @RequestParam("electionId") String electionId,
            Authentication auth) {
        UUID citizenId = PrincipalExtractor.requireVoteCitizenId(auth);
        UUID eid = UuidParsers.parseOr400(electionId, "INVALID_ELECTION_ID", "electionIdが不正です");

        // ★ PUBLICセッション方式：mismatch 判定は不要
        return votingService.startJudgeReviewByCitizen(citizenId, eid);
    }

    @PostMapping("/confirm")
    public void confirm(
            @Valid @RequestBody JudgeReviewConfirmRequest req,
            Authentication auth) {
        UUID citizenId = PrincipalExtractor.requireVoteCitizenId(auth);
        UUID electionId = UuidParsers.parseOr400(req.electionId(), "INVALID_ELECTION_ID", "electionIdが不正です");

        // ★ PUBLICセッション方式：mismatch 判定は不要
        votingService.confirmJudgeReviewByCitizen(citizenId, electionId, req.choices());
    }
}
