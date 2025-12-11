package com.bteam.ovs.vote.web;

import com.bteam.ovs.vote.dto.CastVoteRequest;
import com.bteam.ovs.vote.dto.MyVoteResponse;
import com.bteam.ovs.vote.service.VoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/elections/{electionId}/votes")
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;

    @GetMapping("/me")
    public MyVoteResponse getMyVote(@PathVariable Long electionId) {
        return voteService.getMyVote(electionId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void castVote(
            @PathVariable Long electionId,
            @Valid @RequestBody CastVoteRequest request
    ) {
        voteService.castVote(electionId, request);
    }
}
