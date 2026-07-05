package com.bteam.ovs.elections.controller;

import com.bteam.ovs.candidates.dto.request.CandidateCreateRequest;
import com.bteam.ovs.candidates.dto.response.CandidateResponse;
import com.bteam.ovs.elections.dto.request.ElectionCreateRequest;
import com.bteam.ovs.elections.dto.request.ElectionUpdateRequest;
import com.bteam.ovs.elections.dto.response.ElectionResponse;
import com.bteam.ovs.elections.service.ElectionAdminService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/admin/elections")
public class AdminElectionsController {

    private final ElectionAdminService adminService;

    @GetMapping
    public List<ElectionResponse> list() {
        return adminService.list();
    }

    @GetMapping("/{electionId}")
    public ElectionResponse detail(@PathVariable UUID electionId) {
        return adminService.detail(electionId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ElectionResponse create(@Valid @RequestBody ElectionCreateRequest req) {
        return adminService.create(req);
    }

    @PutMapping("/{electionId}")
    public ElectionResponse update(
            @PathVariable UUID electionId,
            @Valid @RequestBody ElectionUpdateRequest req) {
        return adminService.update(electionId, req);
    }

    @DeleteMapping("/{electionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID electionId) {
        adminService.delete(electionId);
    }

    @PostMapping("/{electionId}/candidates")
    @ResponseStatus(HttpStatus.CREATED)
    public CandidateResponse addCandidate(
            @PathVariable UUID electionId,
            @Valid @RequestBody CandidateCreateRequest req) {
        return adminService.addCandidate(electionId, req);
    }

    @PostMapping("/{electionId}/candidates/bulk")
    @ResponseStatus(HttpStatus.CREATED)
    public List<CandidateResponse> addCandidatesBulk(
            @PathVariable UUID electionId,
            @RequestBody List<@Valid CandidateCreateRequest> reqs) {
        return adminService.addCandidatesBulk(electionId, reqs);
    }
}
