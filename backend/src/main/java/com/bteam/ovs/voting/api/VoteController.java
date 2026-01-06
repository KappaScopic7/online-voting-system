package com.bteam.ovs.voting.api;

import com.bteam.ovs.common.errors.ApiException;
import com.bteam.ovs.voting.api.dto.VoteCreateRequest;
import com.bteam.ovs.voting.application.VotingService;
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
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void vote(@PathVariable UUID electionId, @Valid @RequestBody VoteCreateRequest req, Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }
        votingService.confirm(auth.getName(), electionId, UUID.fromString(req.candidateId()));
    }
}
