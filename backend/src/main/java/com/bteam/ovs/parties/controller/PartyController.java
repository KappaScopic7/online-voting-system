// backend/src/main/java/com/bteam/ovs/elections/controller/PartyController.java
package com.bteam.ovs.parties.controller;

import com.bteam.ovs.parties.service.PartyService;
import com.bteam.ovs.parties.controller.dto.PartyCandidateItem;
import com.bteam.ovs.parties.controller.dto.PartyDetailResponse;
import com.bteam.ovs.parties.controller.dto.PartyListItem;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parties")
public class PartyController {

    private final PartyService partyService;

    public PartyController(PartyService partyService) {
        this.partyService = partyService;
    }

    @GetMapping
    public List<PartyListItem> list() {
        return partyService.list();
    }

    @GetMapping("/{partyKey}")
    public PartyDetailResponse detail(@PathVariable String partyKey) {
        return partyService.getByKey(partyKey);
    }

    @GetMapping("/{partyKey}/candidates")
    public List<PartyCandidateItem> candidates(@PathVariable String partyKey) {
        return partyService.candidatesByPartyKey(partyKey);
    }
}
