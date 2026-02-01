// backend/src/main/java/com/bteam/ovs/candidates/controller/CandidatesController.java
package com.bteam.ovs.candidates.controller;

import com.bteam.ovs.candidates.controller.dto.CandidateDetailResponse;
import com.bteam.ovs.candidates.controller.dto.CandidateItem;
import com.bteam.ovs.candidates.service.CandidateService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/candidates")
public class CandidatesController {

    private final CandidateService candidateService;

    public CandidatesController(CandidateService candidateService) {
        this.candidateService = candidateService;
    }

    @GetMapping
    public List<CandidateItem> list(
            @RequestParam(name = "electionId", required = false) UUID electionId,
            @RequestParam(name = "partyKey", required = false) String partyKey) {
        return candidateService.listAll(electionId, partyKey);
    }

    @GetMapping("/{candidateId}")
    public CandidateDetailResponse getById(
            @PathVariable("candidateId") UUID candidateId) {
        return candidateService.detailByCandidateId(candidateId);
    }
}
