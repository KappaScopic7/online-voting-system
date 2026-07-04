// backend/src/main/java/com/bteam/ovs/elections/controller/PartyController.java
package com.bteam.ovs.parties.controller;

import com.bteam.ovs.parties.dto.response.PartyCandidateItem;
import com.bteam.ovs.parties.dto.response.PartyDetailResponse;
import com.bteam.ovs.parties.dto.response.PartyListItem;
import com.bteam.ovs.parties.service.PartyService;

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
    public PartyDetailResponse detail(@PathVariable("partyKey") String partyKey) {
        return partyService.getByKey(partyKey);
    }

    @GetMapping("/{partyKey}/candidates")
    public List<PartyCandidateItem> candidates(@PathVariable("partyKey") String partyKey) {
        return partyService.candidatesByPartyKey(partyKey);
    }
}
