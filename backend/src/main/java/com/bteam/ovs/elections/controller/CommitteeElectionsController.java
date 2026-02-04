package com.bteam.ovs.elections.controller;

import com.bteam.ovs.elections.controller.dto.ElectionResponse;
import com.bteam.ovs.elections.service.CommitteeElectionService;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.bteam.ovs.elections.controller.dto.ElectionCreateRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;

import java.util.UUID;

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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void create(
            @RequestBody @Valid ElectionCreateRequest request,
            Authentication auth) {
        committeeService.createElection(request, auth);
    }

}
