package com.bteam.ovs.voting.controller;

import com.bteam.ovs.shared.security.PrincipalExtractor;
import com.bteam.ovs.shared.validation.UuidParsers;
import com.bteam.ovs.voting.dto.request.AllocVoteConfirmRequest;
import com.bteam.ovs.voting.dto.response.AllocVoteHistoryItem;
import com.bteam.ovs.voting.dto.response.AllocVoteStartResponse;
import com.bteam.ovs.voting.service.AllocationVotingService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@AllArgsConstructor
@RestController
@RequestMapping("/api/alloc-voting")
public class AllocationVotingController {

    private final AllocationVotingService allocationVotingService;

    @GetMapping("/start")
    public AllocVoteStartResponse start(@RequestParam("electionId") String electionId, Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        UUID eid = UuidParsers.parseOr400(electionId, "INVALID_ELECTION_ID", "electionIdが不正です");
        return allocationVotingService.start(accountId, eid);
    }

    @PostMapping("/confirm")
    public AllocVoteHistoryItem confirm(@Valid @RequestBody AllocVoteConfirmRequest req, Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        UUID electionId = UuidParsers.parseOr400(req.electionId(), "INVALID_ELECTION_ID", "electionIdが不正です");
        // candidateId は items 内にあるのでここでは parse しない（service 側で検証）
        return allocationVotingService.confirm(accountId, electionId, req);
    }

    @GetMapping("/history")
    public List<AllocVoteHistoryItem> history(Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        return allocationVotingService.history(accountId);
    }
}
