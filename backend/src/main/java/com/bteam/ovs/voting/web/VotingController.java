package com.bteam.ovs.voting.web;

import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.voting.service.VotingService;
import com.bteam.ovs.voting.web.dto.VoteConfirmRequest;
import com.bteam.ovs.voting.web.dto.VoteStartResponse;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/voter/voting")
public class VotingController {

    private final VotingService votingService;

    public VotingController(VotingService votingService) {
        this.votingService = votingService;
    }

    @GetMapping("/start")
    public VoteStartResponse start(@RequestParam String electionId, Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }
        UUID eid = UUID.fromString(electionId);
        return votingService.start(auth.getName(), eid);
    }

    @PostMapping("/confirm")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirm(@Valid @RequestBody VoteConfirmRequest req, Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }
        votingService.confirm(
                auth.getName(),
                UUID.fromString(req.electionId()),
                UUID.fromString(req.candidateId())
        );
    }
}
