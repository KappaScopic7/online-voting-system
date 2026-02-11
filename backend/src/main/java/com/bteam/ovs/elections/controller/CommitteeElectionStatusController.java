// backend/src/main/java/com/bteam/ovs/elections/controller/CommitteeElectionStatusController.java
package com.bteam.ovs.elections.controller;

import com.bteam.ovs.elections.controller.dto.SetElectionStatusRequest;
import com.bteam.ovs.elections.service.CommitteeElectionAdminService;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/committee/elections")
public class CommitteeElectionStatusController {

    private final CommitteeElectionAdminService adminService;

    public CommitteeElectionStatusController(CommitteeElectionAdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping("/{electionId}/status")
    public void setStatus(@PathVariable UUID electionId, @RequestBody SetElectionStatusRequest req) {
        adminService.setStatus(electionId, req.status());
    }
}
