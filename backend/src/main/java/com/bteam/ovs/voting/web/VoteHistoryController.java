package com.bteam.ovs.voting.web;

import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.voting.service.VotingService;
import com.bteam.ovs.voting.web.dto.VoteHistoryItem;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/votes")
public class VoteHistoryController {

    private final VotingService votingService;

    public VoteHistoryController(VotingService votingService) {
        this.votingService = votingService;
    }

    @GetMapping
    public List<VoteHistoryItem> list(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }
        return votingService.history(auth.getName());
    }
}
