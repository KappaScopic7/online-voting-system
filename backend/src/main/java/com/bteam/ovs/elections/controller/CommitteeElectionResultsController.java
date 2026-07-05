package com.bteam.ovs.elections.controller;

import com.bteam.ovs.elections.dto.response.ElectionResultBundleResponse;
import com.bteam.ovs.elections.service.ElectionService;
import com.bteam.ovs.shared.security.Authz;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/committee/elections")
@PreAuthorize(Authz.STAFF)
public class CommitteeElectionResultsController {

    private final ElectionService electionService;

    @GetMapping("/{electionId}/results")
    public ElectionResultBundleResponse results(@PathVariable("electionId") UUID electionId) {
        return electionService.committeeResultBundle(electionId);
    }
}