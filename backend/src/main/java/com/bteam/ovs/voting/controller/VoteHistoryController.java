package com.bteam.ovs.voting.controller;

import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.voting.controller.dto.VoteHistoryItem;
import com.bteam.ovs.voting.service.VotingService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

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

        UUID accountId;
        try {
            @SuppressWarnings("unchecked")
            var details = (Map<String, Object>) auth.getDetails();
            accountId = UUID.fromString((String) details.get("aid"));
        } catch (Exception e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }

        return votingService.history(accountId);
    }
}
