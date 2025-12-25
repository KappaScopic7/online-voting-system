package com.bteam.ovs.voter.web;

import com.bteam.ovs.voter.dto.IdentityStatusResponse;
import com.bteam.ovs.voter.dto.IdentityVerifyRequest;
import com.bteam.ovs.voter.service.IdentityVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/voters/identity")
public class IdentityVerificationController {

    private final IdentityVerificationService identityVerificationService;

    @PostMapping("/verify")
    public IdentityStatusResponse verify(@RequestBody IdentityVerifyRequest req) {
        return identityVerificationService.verify(req.getElectionId(), req.getCardId(), req.getPin());
    }

    @GetMapping("/status")
    public IdentityStatusResponse status(@RequestParam Long electionId) {
        return identityVerificationService.status(electionId);
    }
}
