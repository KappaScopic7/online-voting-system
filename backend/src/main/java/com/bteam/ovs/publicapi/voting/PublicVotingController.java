// backend/src/main/java/com/bteam/ovs/publicapi/voting/PublicVotingController.java
package com.bteam.ovs.publicapi.voting;

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

    private static final String ATTR_EID = "voteTokenElectionId";

    private final VotingService votingService;

    public PublicVotingController(VotingService votingService) {
        this.votingService = votingService;
    }

    private UUID requireCitizenId(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "VOTE_TOKEN_REQUIRED", "本人認証（投票トークン）が必要です");
        }
        return (UUID) auth.getPrincipal();
    }

    private UUID requireTokenElectionId(Object v) {
        if (v == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "VOTE_TOKEN_REQUIRED", "本人認証（投票トークン）が必要です");
        }
        return (UUID) v;
    }

    @GetMapping("/start")
    public VoteStartResponse start(
            @RequestParam("electionId") String electionId,
            Authentication auth,
            @RequestAttribute(name = ATTR_EID, required = false) Object tokenEidObj) {

        UUID citizenId = PrincipalExtractor.requireVoteCitizenId(auth);
        UUID reqEid = UuidParsers.parseOr400(electionId, "INVALID_ELECTION_ID", "electionIdが不正です");

        UUID tokenEid = requireTokenElectionId(tokenEidObj);
        if (!tokenEid.equals(reqEid)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "VOTE_TOKEN_MISMATCH", "この選挙用の投票トークンではありません");
        }

        return votingService.startByCitizen(citizenId, reqEid);
    }

    @PostMapping("/confirm")
    public VoteHistoryItem confirm(
            @Valid @RequestBody VoteConfirmRequest req,
            Authentication auth,
            @RequestAttribute(name = ATTR_EID, required = false) Object tokenEidObj) {

        UUID citizenId = PrincipalExtractor.requireVoteCitizenId(auth);

        UUID electionId = UuidParsers.parseOr400(req.electionId(), "INVALID_ELECTION_ID", "electionIdが不正です");
        UUID candidateId = UuidParsers.parseOr400(req.candidateId(), "INVALID_CANDIDATE_ID", "candidateIdが不正です");

        UUID tokenEid = requireTokenElectionId(tokenEidObj);
        if (!tokenEid.equals(electionId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "VOTE_TOKEN_MISMATCH", "この選挙用の投票トークンではありません");
        }

        return votingService.confirmByCitizen(citizenId, electionId, candidateId);
    }
}
