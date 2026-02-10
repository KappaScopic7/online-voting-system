package com.bteam.ovs.voters.voting;

import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.shared.security.PrincipalExtractor;
import com.bteam.ovs.shared.validation.UuidParsers;
import com.bteam.ovs.voting.controller.dto.JudgeReviewConfirmRequest;
import com.bteam.ovs.voting.controller.dto.JudgeReviewStartResponse;
import com.bteam.ovs.voting.service.VotingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
        UUID tokenElectionId = PrincipalExtractor.requireVoteElectionId(auth);

        UUID eid = UuidParsers.parseOr400(
                electionId, "INVALID_ELECTION_ID", "electionIdが不正です");

        if (tokenElectionId != null && !tokenElectionId.equals(eid)) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "ELECTION_MISMATCH",
                    "投票用認証がこの選挙に対応していません");
        }

        return votingService.startJudgeReviewByCitizen(citizenId, eid);
    }

    @PostMapping("/confirm")
    public void confirm(
            @Valid @RequestBody JudgeReviewConfirmRequest req,
            Authentication auth) {
        UUID citizenId = PrincipalExtractor.requireVoteCitizenId(auth);
        UUID tokenElectionId = PrincipalExtractor.requireVoteElectionId(auth);

        UUID electionId = UuidParsers.parseOr400(
                req.electionId(), "INVALID_ELECTION_ID", "electionIdが不正です");

        if (tokenElectionId != null && !tokenElectionId.equals(electionId)) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "ELECTION_MISMATCH",
                    "投票用認証がこの選挙に対応していません");
        }

        votingService.confirmJudgeReviewByCitizen(citizenId, electionId, req.choices());
    }
}
