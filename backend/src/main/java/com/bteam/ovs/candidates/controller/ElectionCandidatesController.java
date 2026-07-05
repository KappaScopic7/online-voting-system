// backend/src/main/java/com/bteam/ovs/candidates/controller/ElectionCandidatesController.java
package com.bteam.ovs.candidates.controller;

import com.bteam.ovs.candidates.dto.response.CandidateDetailResponse;
import com.bteam.ovs.candidates.dto.response.CandidateListItem;
import com.bteam.ovs.candidates.service.CandidateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/elections/{electionId}/candidates")
public class ElectionCandidatesController {

    private final CandidateService candidateService;

    @GetMapping
    public List<CandidateListItem> list(@PathVariable("electionId") UUID electionId) {
        return candidateService.listByElection(electionId);
    }

    @GetMapping("/{candidateId}")
    public CandidateDetailResponse get(
            @PathVariable("electionId") UUID electionId,
            @PathVariable("candidateId") UUID candidateId) {
        return candidateService.detail(electionId, candidateId);
    }
}
