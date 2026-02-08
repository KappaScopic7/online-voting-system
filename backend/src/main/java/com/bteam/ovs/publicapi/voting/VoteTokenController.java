package com.bteam.ovs.publicapi.voting;

import com.bteam.ovs.identity.service.NfcResolveService;
import com.bteam.ovs.publicapi.voting.dto.VoteTokenIssueRequest;
import com.bteam.ovs.publicapi.voting.dto.VoteTokenIssueResponse;
import com.bteam.ovs.publicapi.voting.service.VoteTokenService;
import com.bteam.ovs.shared.validation.UuidParsers;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/api/public/vote-token")
public class VoteTokenController {

    private final NfcResolveService nfcResolveService;
    private final VoteTokenService voteTokenService;

    public VoteTokenController(NfcResolveService nfcResolveService, VoteTokenService voteTokenService) {
        this.nfcResolveService = nfcResolveService;
        this.voteTokenService = voteTokenService;
    }

    @PostMapping("/issue")
    public VoteTokenIssueResponse issue(@Valid @RequestBody VoteTokenIssueRequest req) {
        UUID electionId = UuidParsers.parseOr400(req.electionId(), "INVALID_ELECTION_ID", "electionIdが不正です");

        // payload から citizenId を抽出（存在チェックは投票側で弾かれても良いが、ここで弾きたければ resolve() を使う）
        UUID citizenId = nfcResolveService.resolveCitizenId(req.payload());

        String token = voteTokenService.issue(citizenId, electionId);
        return new VoteTokenIssueResponse(token);
    }
}
