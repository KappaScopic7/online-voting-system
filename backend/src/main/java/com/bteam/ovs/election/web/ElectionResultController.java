package com.bteam.ovs.election.web;

import com.bteam.ovs.election.dto.ElectionResultItem;
import com.bteam.ovs.election.service.ElectionResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/elections")
@RequiredArgsConstructor
public class ElectionResultController {

    private final ElectionResultService electionResultService;

    @GetMapping("/{electionId}/result")
    public List<ElectionResultItem> getElectionResult(@PathVariable Long electionId) {
        return electionResultService.getResult(electionId);
    }
}
