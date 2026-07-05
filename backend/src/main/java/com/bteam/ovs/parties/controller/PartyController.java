// backend/src/main/java/com/bteam/ovs/elections/controller/PartyController.java
package com.bteam.ovs.parties.controller;

import com.bteam.ovs.parties.dto.response.PartyCandidateItem;
import com.bteam.ovs.parties.dto.response.PartyDetailResponse;
import com.bteam.ovs.parties.dto.response.PartyListItem;
import com.bteam.ovs.parties.service.PartyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/parties")
public class PartyController {

    private final PartyService partyService;

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
