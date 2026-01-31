// backend/src/main/java/com/bteam/ovs/elections/controller/CandidatesController.java
package com.bteam.ovs.elections.controller;

import com.bteam.ovs.elections.controller.dto.CandidateItem;
import com.bteam.ovs.elections.service.ElectionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/candidates")
public class CandidatesController {

    private final ElectionService electionService;

    public CandidatesController(ElectionService electionService) {
        this.electionService = electionService;
    }

    @GetMapping
    public List<CandidateItem> list(
            @RequestParam(required = false) UUID electionId,
            @RequestParam(required = false) String partyKey) {
        return electionService.candidatesAll(electionId, partyKey);
    }
}
