// backend/src/main/java/com/bteam/ovs/elections/controller/CommitteeElectionStatusController.java
package com.bteam.ovs.elections.controller;

import com.bteam.ovs.elections.dto.request.SetElectionStatusRequest;
import com.bteam.ovs.elections.service.CommitteeElectionAdminService;
import org.springframework.web.bind.annotation.*;
import com.bteam.ovs.shared.security.Authz;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.UUID;

@RestController
@RequestMapping("/api/committee/elections")
public class CommitteeElectionStatusController {

    private final CommitteeElectionAdminService adminService;

    public CommitteeElectionStatusController(CommitteeElectionAdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping("/{electionId}/status")
    @PreAuthorize(Authz.STAFF)
    public void setStatus(@PathVariable("electionId") UUID electionId, @RequestBody SetElectionStatusRequest req) {
        adminService.setStatus(electionId, req.status());
    }
}