package com.bteam.ovs.voter.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.bteam.ovs.voter.dto.LoginResponse;
import com.bteam.ovs.voter.dto.VerifyIdentityRequest;
import com.bteam.ovs.voter.service.VoterIdentityService;

@RestController
@RequestMapping("/api/auth/voter")
public class VoterIdentityAuthController {

    private final VoterIdentityService voterIdentityService;

    public VoterIdentityAuthController(VoterIdentityService voterIdentityService) {
        this.voterIdentityService = voterIdentityService;
    }

    @PostMapping("/verify-identity")
    public ResponseEntity<LoginResponse> verify(@RequestBody VerifyIdentityRequest req) {
        String token = voterIdentityService.verifyAndIssueToken(req.cardId(), req.pin());
        return ResponseEntity.ok(new LoginResponse(token, "Bearer"));
    }
}
