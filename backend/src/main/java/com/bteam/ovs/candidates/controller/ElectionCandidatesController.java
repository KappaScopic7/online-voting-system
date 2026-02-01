// backend/src/main/java/com/bteam/ovs/candidates/controller/ElectionCandidatesController.java
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
    public List<CandidateItem> list(@PathVariable("electionId") UUID electionId) {
        return candidateService.listByElection(electionId);
    }

    @GetMapping("/{candidateId}")
    public CandidateDetailResponse get(
            @PathVariable("electionId") UUID electionId,
            @PathVariable("candidateId") UUID candidateId) {
        return candidateService.detail(electionId, candidateId);
    }
}
