package com.bteam.ovs.voter.web;

import com.bteam.ovs.voter.dto.VerifyIdentityRequest;
import com.bteam.ovs.voter.service.VoterVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/elections/{electionId}/verification")
public class VoterVerificationController {

    private final VoterVerificationService voterVerificationService;

    @PostMapping
    public void verify(@PathVariable Long electionId, @RequestBody @Valid VerifyIdentityRequest req) {
        voterVerificationService.verifyForElection(electionId, req.cardId(), req.pin());
    }

    @GetMapping("/me")
    public boolean me(@PathVariable Long electionId) {
        return voterVerificationService.isVerified(electionId);
    }
}
