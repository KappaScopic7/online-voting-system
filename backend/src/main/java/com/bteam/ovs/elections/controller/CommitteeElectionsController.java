package com.bteam.ovs.elections.controller;

import com.bteam.ovs.elections.controller.dto.ElectionResponse;
import com.bteam.ovs.elections.service.CommitteeElectionService;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/committee/elections")
public class CommitteeElectionsController {

    private final CommitteeElectionService committeeService;

    public CommitteeElectionsController(CommitteeElectionService committeeService) {
        this.committeeService = committeeService;
    }

    @GetMapping
    public List<ElectionResponse> list(Authentication auth) {
        return committeeService.listElections(auth);
    }
}
