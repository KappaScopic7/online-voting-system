package com.bteam.ovs.candidates.controller;

import com.bteam.ovs.candidates.controller.dto.CandidateDetailResponse;
import com.bteam.ovs.candidates.controller.dto.CandidateItem;
import com.bteam.ovs.candidates.service.CandidateService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/elections/{electionId}/candidates")
public class ElectionCandidatesController {

    private final CandidateService candidateService;

    public ElectionCandidatesController(CandidateService candidateService) {
        this.candidateService = candidateService;
    }

    @GetMapping
    public List<CandidateItem> list(@PathVariable UUID electionId) {
        return candidateService.listByElection(electionId);
    }

    @GetMapping("/{candidateId}")
    public CandidateDetailResponse get(
            @PathVariable UUID electionId,
            @PathVariable UUID candidateId) {
        return candidateService.detail(electionId, candidateId);
    }
}
