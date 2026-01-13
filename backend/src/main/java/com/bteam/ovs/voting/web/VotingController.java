package com.bteam.ovs.voting.web;

import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.voting.service.VotingService;
import com.bteam.ovs.voting.web.dto.VoteConfirmRequest;
import com.bteam.ovs.voting.web.dto.VoteHistoryItem;
import com.bteam.ovs.voting.web.dto.VoteStartResponse;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/voting")
public class VotingController {

    private final VotingService votingService;

    public VotingController(VotingService votingService) {
        this.votingService = votingService;
    }

    @GetMapping("/start")
    public VoteStartResponse start(@RequestParam("electionId") String electionId, Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }

        UUID accountId;
        try {
            accountId = UUID.fromString(auth.getName()); // principal=aid(UUID文字列)
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }

        UUID eid;
        try {
            eid = UUID.fromString(electionId);
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ELECTION_ID", "electionIdが不正です");
        }

        return votingService.start(accountId, eid);
    }

    @PostMapping("/confirm")
    public VoteHistoryItem confirm(@Valid @RequestBody VoteConfirmRequest req, Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }

        UUID accountId;
        try {
            accountId = UUID.fromString(auth.getName());
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }

        UUID electionId;
        try {
            electionId = UUID.fromString(req.electionId());
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ELECTION_ID", "electionIdが不正です");
        }

        UUID candidateId;
        try {
            candidateId = UUID.fromString(req.candidateId());
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CANDIDATE_ID", "candidateIdが不正です");
        }

        return votingService.confirm(accountId, electionId, candidateId);
    }

    @GetMapping("/history")
    public List<VoteHistoryItem> history(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }

        UUID accountId;
        try {
            accountId = UUID.fromString(auth.getName());
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }

        return votingService.history(accountId);
    }
}
