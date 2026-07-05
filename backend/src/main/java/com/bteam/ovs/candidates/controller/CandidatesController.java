// backend/src/main/java/com/bteam/ovs/candidates/controller/CandidatesController.java
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
@RequestMapping("/api/candidates")
public class CandidatesController {

    private final CandidateService candidateService;

    @GetMapping
    public List<CandidateListItem> list(
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
