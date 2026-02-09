package com.bteam.ovs.announcement.controller;

import com.bteam.ovs.announcement.controller.dto.SystemAnnouncementResponse;
import com.bteam.ovs.announcement.controller.dto.SystemAnnouncementUpdateRequest;
import com.bteam.ovs.announcement.service.SystemAnnouncementService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/committee/announcement")
public class CommitteeAnnouncementController {

    private final SystemAnnouncementService service;

    public CommitteeAnnouncementController(SystemAnnouncementService service) {
        this.service = service;
    }

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
