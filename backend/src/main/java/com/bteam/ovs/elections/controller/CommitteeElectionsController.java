package com.bteam.ovs.elections.controller;

import com.bteam.ovs.elections.controller.dto.CommitteeElectionListItem;
import com.bteam.ovs.elections.controller.dto.ElectionDetailResponse;
import com.bteam.ovs.elections.service.CommitteeElectionService;
import com.bteam.ovs.shared.security.Authz;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/committee/elections")
public class CommitteeElectionsController {

    private final CommitteeElectionService service;

    public CommitteeElectionsController(CommitteeElectionService service) {
        this.service = service;
    }

    @PostMapping("/{electionId}/actions/ready")
    @PreAuthorize(Authz.STAFF)
    public ElectionDetailResponse markReady(@PathVariable String electionId) {
        UUID eid = UUID.fromString(electionId);
        return service.markReady(eid);
    }

    @PostMapping("/{electionId}/actions/start")
    @PreAuthorize(Authz.STAFF)
    public ElectionDetailResponse start(@PathVariable String electionId) {
        UUID eid = UUID.fromString(electionId);
        return service.start(eid);
    }

    @PostMapping("/{electionId}/actions/close")
    @PreAuthorize(Authz.STAFF)
    public ElectionDetailResponse close(@PathVariable String electionId) {
        UUID eid = UUID.fromString(electionId);
        return service.close(eid);
    }

    @PostMapping("/{electionId}/actions/tally")
    @PreAuthorize(Authz.STAFF)
    public ElectionDetailResponse tally(@PathVariable String electionId) {
        UUID eid = UUID.fromString(electionId);
        return service.tally(eid);
    }

    @PostMapping("/{electionId}/actions/publish")
    @PreAuthorize(Authz.STAFF)
    public ElectionDetailResponse publish(@PathVariable String electionId) {
        UUID eid = UUID.fromString(electionId);
        return service.publish(eid);
    }

    @PostMapping("/{electionId}/actions/unpublish")
    @PreAuthorize(Authz.STAFF)
    public ElectionDetailResponse unpublish(@PathVariable String electionId) {
        UUID eid = UUID.fromString(electionId);
        return service.unpublish(eid);
    }

    @GetMapping
    @PreAuthorize(Authz.STAFF)
    public List<CommitteeElectionListItem> list() {
        return service.list();
    }
}
