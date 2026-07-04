package com.bteam.ovs.profile.controller;

import com.bteam.ovs.profile.dto.request.MeProfileUpdateRequest;
import com.bteam.ovs.profile.dto.response.MeProfileResponse;
import com.bteam.ovs.profile.service.MeProfileService;
import com.bteam.ovs.shared.security.PrincipalExtractor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/me/profile")
public class MeProfileController {

    private final MeProfileService meProfileService;

    public MeProfileController(MeProfileService meProfileService) {
        this.meProfileService = meProfileService;
    }

    @GetMapping
    public ResponseEntity<MeProfileResponse> get(Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);

        var res = meProfileService.find(accountId);
        return res == null
                ? ResponseEntity.noContent().build()
                : ResponseEntity.ok(res);
    }

    @PutMapping
    public MeProfileResponse put(@Valid @RequestBody MeProfileUpdateRequest req, Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        return meProfileService.upsert(accountId, req);
    }
}
