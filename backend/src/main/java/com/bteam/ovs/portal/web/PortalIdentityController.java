package com.bteam.ovs.portal.web;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.bteam.ovs.portal.dto.LinkIdentityRequest;
import com.bteam.ovs.voter.dto.LoginResponse;
import com.bteam.ovs.portal.service.IdentityLinkService;

@RestController
@RequestMapping("/api/portal/identity")
public class PortalIdentityController {

    private final IdentityLinkService identityLinkService;

    public PortalIdentityController(IdentityLinkService identityLinkService) {
        this.identityLinkService = identityLinkService;
    }

    @PostMapping("/link")
    public ResponseEntity<LoginResponse> link(Authentication auth, @RequestBody LinkIdentityRequest req) {
        String email = (String) auth.getPrincipal(); // JwtAuthenticationFilterより principal=subject(email)
        String voterToken = identityLinkService.linkAndIssueVoterToken(email, req.cardId(), req.pin());
        return ResponseEntity.ok(new LoginResponse(voterToken, "Bearer"));
    }
}
