package com.bteam.ovs.elections.web;

import com.bteam.ovs.elections.service.ElectionAdminService;
import com.bteam.ovs.elections.web.dto.CandidateCreateRequest;
import com.bteam.ovs.elections.web.dto.CandidateResponse;
import com.bteam.ovs.elections.web.dto.ElectionCreateRequest;
import com.bteam.ovs.elections.web.dto.ElectionResponse;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/elections")
public class AdminElectionsController {

    private final ElectionAdminService adminService;

    public AdminElectionsController(ElectionAdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ElectionResponse create(@Valid @RequestBody ElectionCreateRequest req) {
        return adminService.create(req);
    }

    @PostMapping("/{electionId}/candidates")
    @ResponseStatus(HttpStatus.CREATED)
    public CandidateResponse addCandidate(
            @PathVariable UUID electionId,
            @Valid @RequestBody CandidateCreateRequest req
    ) {
        return adminService.addCandidate(electionId, req);
    }
}
