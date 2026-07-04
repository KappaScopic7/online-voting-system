package com.bteam.ovs.voters.controller;

import com.bteam.ovs.elections.dto.response.ElectionListItem;
import com.bteam.ovs.shared.security.PrincipalExtractor;
import com.bteam.ovs.voters.service.VoterElectionsService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/voters")
public class VotersController {

    private final VoterElectionsService voterElectionsService;

    public VotersController(VoterElectionsService voterElectionsService) {
        this.voterElectionsService = voterElectionsService;
    }

    @GetMapping("/my-elections")
    public List<ElectionListItem> myElections(Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        return voterElectionsService.listMyElectionsByAccount(accountId);
    }
}
