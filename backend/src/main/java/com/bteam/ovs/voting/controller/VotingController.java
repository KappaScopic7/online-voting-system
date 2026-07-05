package com.bteam.ovs.voting.controller;

import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.shared.security.PrincipalExtractor;
import com.bteam.ovs.shared.validation.UuidParsers;
import com.bteam.ovs.voting.dto.request.VoteConfirmRequest;
import com.bteam.ovs.voting.dto.response.VoteHistoryItem;
import com.bteam.ovs.voting.dto.response.VoteStartResponse;
import com.bteam.ovs.voting.service.VotingService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@AllArgsConstructor
@RestController
@RequestMapping("/api/voting")
public class VotingController {

    private final VotingService votingService;

    @GetMapping("/start")
    public VoteStartResponse start(@RequestParam("electionId") String electionId, Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        UUID eid = UuidParsers.parseOr400(electionId, "INVALID_ELECTION_ID", "electionIdが不正です");
        return votingService.start(accountId, eid);
    }

    @PostMapping("/confirm")
    public VoteHistoryItem confirm(@Valid @RequestBody VoteConfirmRequest req, Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        UUID electionId = UuidParsers.parseOr400(req.electionId(), "INVALID_ELECTION_ID", "electionIdが不正です");

        String type = req.type();
        if ("NONE_SUPPORT".equals(type)) {
            return votingService.confirmNoneSupport(accountId, electionId);
        }
        if (!"CANDIDATE".equals(type)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_VOTE_TYPE", "typeが不正です");
        }
        if (req.candidateId() == null || req.candidateId().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE_ID", "candidateIdが不正です");
        }

        UUID candidateId = UuidParsers.parseOr400(req.candidateId(), "INVALID_CANDIDATE_ID", "candidateIdが不正です");
        return votingService.confirmCandidate(accountId, electionId, candidateId);
    }

    @GetMapping("/history")
    public List<VoteHistoryItem> history(Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        return votingService.history(accountId);
    }
}
