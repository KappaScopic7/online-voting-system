package com.bteam.ovs.elections.controller;

import com.bteam.ovs.elections.controller.dto.ElectionResultBundleResponse;
import com.bteam.ovs.elections.entity.BallotType;
import com.bteam.ovs.elections.entity.ElectionStatus;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.elections.service.ElectionService;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.shared.security.Authz;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/committee/elections")
@PreAuthorize(Authz.STAFF)
public class CommitteeElectionResultsController {

    private final ElectionRepository electionRepo;
    private final ElectionService electionService;

    public CommitteeElectionResultsController(ElectionRepository electionRepo, ElectionService electionService) {
        this.electionRepo = electionRepo;
        this.electionService = electionService;
    }

    @GetMapping("/{electionId}/results")
    public ElectionResultBundleResponse results(@PathVariable UUID electionId) {

        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        // 委員会は「集計済み」から閲覧可（公開は不要）
        var st = election.getStatus();
        if (st == ElectionStatus.TALLYING) {
            throw new ApiException(HttpStatus.CONFLICT, "TALLY_IN_PROGRESS", "集計中です");
        }
        if (st != ElectionStatus.TALLIED && st != ElectionStatus.PUBLISHED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "RESULT_NOT_AVAILABLE", "結果は集計後に閲覧できます");
        }

        if (election.getBallotType() == BallotType.ALLOCATION) {
            return new ElectionResultBundleResponse(
                    electionId,
                    election.getBallotType().name(),
                    null,
                    electionService.allocResultInternal(electionId));
        }

        return new ElectionResultBundleResponse(
                electionId,
                election.getBallotType().name(),
                electionService.resultInternal(electionId),
                null);
    }
}
