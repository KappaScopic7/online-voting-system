package com.bteam.ovs.voter.web;

import com.bteam.ovs.voter.dto.MyVoteHistoryResponse;
import com.bteam.ovs.voter.service.VoterVoteHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/voters")
@RequiredArgsConstructor
public class VoterVoteHistoryController {

    private final VoterVoteHistoryService voterVoteHistoryService;

    @GetMapping("/my-votes")
    public List<MyVoteHistoryResponse> getMyVotes() {
        return voterVoteHistoryService.getMyVoteHistory();
    }
}
