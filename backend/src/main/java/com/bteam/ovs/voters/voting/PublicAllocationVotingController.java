package com.bteam.ovs.voters.voting;

import com.bteam.ovs.shared.security.PrincipalExtractor;
import com.bteam.ovs.shared.validation.UuidParsers;
import com.bteam.ovs.voting.controller.dto.AllocVoteConfirmRequest;
import com.bteam.ovs.voting.controller.dto.AllocVoteHistoryItem;
import com.bteam.ovs.voting.controller.dto.AllocVoteStartResponse;
import com.bteam.ovs.voting.service.AllocationVotingService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/public/alloc-voting")
public class PublicAllocationVotingController {

    private final AllocationVotingService allocationVotingService;

    public PublicAllocationVotingController(AllocationVotingService allocationVotingService) {
        this.allocationVotingService = allocationVotingService;
    }

    @GetMapping("/start")
    public AllocVoteStartResponse start(
            @RequestParam("electionId") String electionId,
            Authentication auth) {
        UUID citizenId = PrincipalExtractor.requireVoteCitizenId(auth);

        UUID eid = UuidParsers.parseOr400(electionId, "INVALID_ELECTION_ID", "electionIdが不正です");

        // ★ tokenElectionId の mismatch 判定は不要（PUBLICは選挙に紐づかない）
        return allocationVotingService.startByCitizen(citizenId, eid);
    }

    @PostMapping("/confirm")
    public AllocVoteHistoryItem confirm(
            @Valid @RequestBody AllocVoteConfirmRequest req,
            Authentication auth) {
        UUID citizenId = PrincipalExtractor.requireVoteCitizenId(auth);

        UUID electionId = UuidParsers.parseOr400(req.electionId(), "INVALID_ELECTION_ID", "electionIdが不正です");

        // ★ tokenElectionId の mismatch 判定は不要
        return allocationVotingService.confirmByCitizen(citizenId, electionId, req);
    }
}
