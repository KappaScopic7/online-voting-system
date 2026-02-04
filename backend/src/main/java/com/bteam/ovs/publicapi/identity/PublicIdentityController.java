// backend/src/main/java/com/bteam/ovs/publicapi/identity/PublicIdentityController.java
package com.bteam.ovs.publicapi.identity;

import com.bteam.ovs.publicapi.identity.dto.NfcVerifyRequest;
import com.bteam.ovs.publicapi.identity.dto.NfcVerifyResponse;
import com.bteam.ovs.shared.errors.ApiException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/public/identity")
public class PublicIdentityController {

    private final VoteTokenService voteTokenService;

    public PublicIdentityController(VoteTokenService voteTokenService) {
        this.voteTokenService = voteTokenService;
    }

    @PostMapping("/verify")
    public NfcVerifyResponse verify(@Valid @RequestBody NfcVerifyRequest req) {
        UUID citizenId;
        UUID electionId;
        try {
            citizenId = UUID.fromString(req.uuid());
            electionId = UUID.fromString(req.electionId());
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "UUIDが不正です");
        }

        var token = voteTokenService.issue(citizenId, electionId);
        return new NfcVerifyResponse(token, "Bearer", voteTokenService.expiresInSeconds());
    }

}
