package com.bteam.ovs.voting.web;

import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.voting.service.VotingService;
import com.bteam.ovs.voting.web.dto.VoteCreateRequest;
import com.bteam.ovs.voting.web.dto.VoteHistoryItem;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/voter/elections")
public class VoteController {

    private final VotingService votingService;

    public VoteController(VotingService votingService) {
        this.votingService = votingService;
    }

    @PostMapping("/{electionId}/votes")
    @ResponseStatus(HttpStatus.CREATED)
    public VoteHistoryItem vote(@PathVariable UUID electionId, @Valid @RequestBody VoteCreateRequest req, Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }
        return votingService.confirm(auth.getName(), electionId, UUID.fromString(req.candidateId()));
    }
}
