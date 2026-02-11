package com.bteam.ovs.voters.voting;

import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.shared.security.PrincipalExtractor;
import com.bteam.ovs.shared.validation.UuidParsers;
import com.bteam.ovs.voting.controller.dto.AllocVoteConfirmRequest;
import com.bteam.ovs.voting.controller.dto.AllocVoteHistoryItem;
import com.bteam.ovs.voting.controller.dto.AllocVoteStartResponse;
import com.bteam.ovs.voting.service.AllocationVotingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
    public AllocVoteStartResponse start(@RequestParam("electionId") String electionId, Authentication auth) {
        UUID citizenId = PrincipalExtractor.requireVoteCitizenId(auth);
        UUID tokenElectionId = PrincipalExtractor.getVoteElectionId(auth);

        UUID eid = UuidParsers.parseOr400(electionId, "INVALID_ELECTION_ID", "electionIdが不正です");
        if (tokenElectionId != null && !tokenElectionId.equals(eid)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ELECTION_MISMATCH", "投票用認証がこの選挙に対応していません");
        }

        return allocationVotingService.startByCitizen(citizenId, eid);
    }

    @PostMapping("/confirm")
    public AllocVoteHistoryItem confirm(@Valid @RequestBody AllocVoteConfirmRequest req, Authentication auth) {
        UUID citizenId = PrincipalExtractor.requireVoteCitizenId(auth);
        UUID tokenElectionId = PrincipalExtractor.getVoteElectionId(auth);

        UUID electionId = UuidParsers.parseOr400(req.electionId(), "INVALID_ELECTION_ID", "electionIdが不正です");
        if (tokenElectionId != null && !tokenElectionId.equals(electionId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ELECTION_MISMATCH", "投票用認証がこの選挙に対応していません");
        }

        return allocationVotingService.confirmByCitizen(citizenId, electionId, req);
    }
}
