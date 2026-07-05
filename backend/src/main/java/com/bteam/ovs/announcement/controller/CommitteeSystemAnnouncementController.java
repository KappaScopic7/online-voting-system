package com.bteam.ovs.announcement.controller;

import com.bteam.ovs.announcement.dto.request.SystemAnnouncementUpdateRequest;
import com.bteam.ovs.announcement.dto.response.SystemAnnouncementResponse;
import com.bteam.ovs.announcement.service.SystemAnnouncementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/committee/announcement")
public class CommitteeSystemAnnouncementController {

    private final SystemAnnouncementService service;

    @GetMapping
    @PreAuthorize("hasAuthority('KIND_STAFF')")
    public SystemAnnouncementResponse get() {
        return service.getForCommittee();
    }

    @PutMapping
    @PreAuthorize("hasAuthority('KIND_STAFF')")
    public SystemAnnouncementResponse update(@Valid @RequestBody SystemAnnouncementUpdateRequest req) {
        return service.update(req);
    }
}
