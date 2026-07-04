package com.bteam.ovs.voting.controller;

import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.shared.security.PrincipalExtractor;
import com.bteam.ovs.shared.validation.UuidParsers;
import com.bteam.ovs.voting.dto.request.VoteConfirmRequest;
import com.bteam.ovs.voting.dto.response.VoteHistoryItem;
import com.bteam.ovs.voting.dto.response.VoteStartResponse;
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
        UUID eid = UuidParsers.parseOr400(electionId, "INVALID_ELECTION_ID", "electionIdが不正です");

        // ★ PUBLICセッション方式：tokenは選挙に紐づかないので mismatch 判定は不要
        return votingService.startByCitizen(citizenId, eid);
    }

    @PostMapping("/confirm")
    public VoteHistoryItem confirm(
            @Valid @RequestBody VoteConfirmRequest req,
            Authentication auth) {
        UUID citizenId = PrincipalExtractor.requireVoteCitizenId(auth);
        UUID electionId = UuidParsers.parseOr400(req.electionId(), "INVALID_ELECTION_ID", "electionIdが不正です");

        // ★ PUBLICセッション方式：mismatch 判定は不要

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
