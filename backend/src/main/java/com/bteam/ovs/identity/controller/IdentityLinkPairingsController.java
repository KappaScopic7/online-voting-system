package com.bteam.ovs.identity.controller;

import com.bteam.ovs.identity.dto.response.LinkPairingDtos;
import com.bteam.ovs.identity.service.LinkPairingService;
import com.bteam.ovs.shared.security.PrincipalExtractor;

import lombok.AllArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@AllArgsConstructor
@RestController
@RequestMapping("/api/identity/link-pairings")
public class IdentityLinkPairingsController {

    private final LinkPairingService service;

    @PostMapping
    public LinkPairingDtos.CreateResponse create(Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        var p = service.create(accountId);
        return new LinkPairingDtos.CreateResponse(p.getPairId(), p.getExpiresAt());
    }
}
