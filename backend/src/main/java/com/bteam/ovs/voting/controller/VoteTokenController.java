// backend/src/main/java/com/bteam/ovs/publicapi/voting/VoteTokenController.java
package com.bteam.ovs.voting.controller;

import com.bteam.ovs.identity.service.NfcResolveService;
import com.bteam.ovs.shared.validation.UuidParsers;
import com.bteam.ovs.voting.dto.request.VoteTokenIssueRequest;
import com.bteam.ovs.voting.dto.response.VoteTokenIssueResponse;
import com.bteam.ovs.voting.service.VoteTokenService;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/public/vote-token")
public class VoteTokenController {

    private final NfcResolveService nfcResolveService;
    private final VoteTokenService voteTokenService;

    @PostMapping("/issue")
    public VoteTokenIssueResponse issue(@Valid @RequestBody VoteTokenIssueRequest req) {
        UUID electionId = UuidParsers.parseOr400(req.electionId(), "INVALID_ELECTION_ID", "electionIdが不正です");

        // ✅ payload + pin で citizenId を確定
        UUID citizenId = nfcResolveService.resolveCitizenId(req.payload(), req.pin());

        String token = voteTokenService.issue(citizenId, electionId);
        return new VoteTokenIssueResponse(token);
    }
}
