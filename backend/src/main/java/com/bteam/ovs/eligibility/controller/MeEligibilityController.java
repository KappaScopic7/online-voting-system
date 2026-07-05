package com.bteam.ovs.eligibility.controller;

import com.bteam.ovs.eligibility.dto.response.MeEligibilityResponse;
import com.bteam.ovs.eligibility.service.EligibilityProfileResolver;
import com.bteam.ovs.shared.security.PrincipalExtractor;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/me/eligibility")
public class MeEligibilityController {

    private final EligibilityProfileResolver resolver;

    @GetMapping
    public MeEligibilityResponse get(Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        var snap = resolver.resolve(accountId);
        return MeEligibilityResponse.from(snap);
    }
}