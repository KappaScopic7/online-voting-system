package com.bteam.ovs.voting.controller;

import com.bteam.ovs.shared.security.PrincipalExtractor;
import com.bteam.ovs.voting.dto.response.VoteHistoryItem;
import com.bteam.ovs.voting.service.VotingService;

import lombok.AllArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@AllArgsConstructor
@RestController
@RequestMapping("/api/votes")
public class VoteHistoryController {

    private final VotingService votingService;

    @GetMapping
    public List<VoteHistoryItem> list(Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        return votingService.history(accountId);
    }
}
