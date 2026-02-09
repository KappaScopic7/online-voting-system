package com.bteam.ovs.voters.voting;

import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.shared.security.PrincipalExtractor;
import com.bteam.ovs.shared.validation.UuidParsers;
import com.bteam.ovs.voting.controller.dto.VoteConfirmRequest;
import com.bteam.ovs.voting.controller.dto.VoteHistoryItem;
import com.bteam.ovs.voting.controller.dto.VoteStartResponse;
import com.bteam.ovs.voting.service.VotingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/public/voting")
public class PublicVotingController {

    private final VotingService votingService;

    public PublicVotingController(VotingService votingService) {
        this.votingService = votingService;
    }

    @GetMapping("/start")
    public VoteStartResponse start(
            @RequestParam("electionId") String electionId,
            Authentication auth) {

        UUID citizenId = PrincipalExtractor.requireVoteCitizenId(auth);
        UUID tokenElectionId = PrincipalExtractor.requireVoteElectionId(auth);

        UUID eid = UuidParsers.parseOr400(electionId, "INVALID_ELECTION_ID", "electionIdが不正です");

        // token は election 専用なので必ず一致させる
        if (tokenElectionId != null && !tokenElectionId.equals(eid)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ELECTION_MISMATCH", "投票用認証がこの選挙に対応していません");
        }

        return votingService.startByCitizen(citizenId, eid);
    }

    @PostMapping("/confirm")
    public VoteHistoryItem confirm(
            @Valid @RequestBody VoteConfirmRequest req,
            Authentication auth) {

        UUID citizenId = PrincipalExtractor.requireVoteCitizenId(auth);
        UUID tokenElectionId = PrincipalExtractor.requireVoteElectionId(auth);

        UUID electionId = UuidParsers.parseOr400(req.electionId(), "INVALID_ELECTION_ID", "electionIdが不正です");

        if (tokenElectionId != null && !tokenElectionId.equals(electionId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ELECTION_MISMATCH", "投票用認証がこの選挙に対応していません");
        }

        String type = req.type();
        if ("NONE_SUPPORT".equals(type)) {
            return votingService.confirmNoneSupportByCitizen(citizenId, electionId);
        }

        if (!"CANDIDATE".equals(type)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_VOTE_TYPE", "typeが不正です");
        }

        if (req.candidateId() == null || req.candidateId().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE_ID", "candidateIdが不正です");
        }

        UUID candidateId = UuidParsers.parseOr400(req.candidateId(), "INVALID_CANDIDATE_ID", "candidateIdが不正です");
        return votingService.confirmByCitizen(citizenId, electionId, candidateId);
    }
}
