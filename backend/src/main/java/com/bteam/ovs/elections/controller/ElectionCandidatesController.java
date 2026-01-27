// backend/src/main/java/com/bteam/ovs/elections/controller/ElectionCandidatesController.java
package com.bteam.ovs.elections.controller;

import com.bteam.ovs.elections.controller.dto.CandidateDetailResponse;
import com.bteam.ovs.elections.controller.dto.CandidateItem;
import com.bteam.ovs.elections.service.ElectionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController @RequestMapping("/api/elections/{electionId}/candidates")
public class ElectionCandidatesController {

    private final ElectionService electionService;

    public ElectionCandidatesController(ElectionService electionService) {
        this.electionService = electionService;
    }

    @GetMapping
    public List<CandidateItem> list(@PathVariable UUID electionId) {
        return electionService.candidates(electionId);
    }

    @GetMapping("/{candidateId}")
    public CandidateDetailResponse get(
            @PathVariable UUID electionId,
            @PathVariable UUID candidateId) {
        return electionService.candidateDetail(electionId, candidateId);
    }
}
