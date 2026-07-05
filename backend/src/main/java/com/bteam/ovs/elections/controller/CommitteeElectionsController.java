// backend/src/main/java/com/bteam/ovs/elections/controller/CommitteeElectionsController.java
package com.bteam.ovs.elections.controller;

import com.bteam.ovs.elections.dto.response.CommitteeElectionListItem;
import com.bteam.ovs.elections.dto.response.ElectionDetailResponse;
import com.bteam.ovs.elections.service.CommitteeElectionAdminService;
import com.bteam.ovs.elections.service.CommitteeElectionService;
import com.bteam.ovs.shared.security.Authz;

import lombok.AllArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@AllArgsConstructor
@RestController
@RequestMapping("/api/committee/elections")
@PreAuthorize(Authz.STAFF)
public class CommitteeElectionsController {

    private final CommitteeElectionService queryService;
    private final CommitteeElectionAdminService adminService;

    @PostMapping("/{electionId}/actions/ready")
    public ElectionDetailResponse markReady(@PathVariable("electionId") UUID electionId) {
        return adminService.markReady(electionId);
    }

    @PostMapping("/{electionId}/actions/start")
    public ElectionDetailResponse start(@PathVariable("electionId") UUID electionId) {
        return adminService.start(electionId);
    }

    @PostMapping("/{electionId}/actions/close")
    public ElectionDetailResponse close(@PathVariable("electionId") UUID electionId) {
        return adminService.close(electionId);
    }

    @PostMapping("/{electionId}/actions/tally")
    public ElectionDetailResponse tally(@PathVariable("electionId") UUID electionId) {
        return adminService.tally(electionId);
    }

    @PostMapping("/{electionId}/actions/publish")
    public ElectionDetailResponse publish(@PathVariable("electionId") UUID electionId) {
        return adminService.publish(electionId);
    }

    @PostMapping("/{electionId}/actions/unpublish")
    public ElectionDetailResponse unpublish(@PathVariable("electionId") UUID electionId) {
        return adminService.unpublish(electionId);
    }

    @GetMapping
    public List<CommitteeElectionListItem> list() {
        return queryService.list();
    }

    @GetMapping("/{electionId}")
    public ElectionDetailResponse detail(@PathVariable("electionId") UUID electionId) {
        return queryService.detail(electionId);
    }
}
