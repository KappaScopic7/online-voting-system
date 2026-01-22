package com.bteam.ovs.profile.web;

import com.bteam.ovs.profile.service.MeProfileService;
import com.bteam.ovs.profile.web.dto.MeProfileResponse;
import com.bteam.ovs.profile.web.dto.MeProfileUpdateRequest;
import com.bteam.ovs.shared.errors.ApiException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/me/profile")
public class MeProfileController {

    private final MeProfileService meProfileService;

    public MeProfileController(MeProfileService meProfileService) {
        this.meProfileService = meProfileService;
    }

    @GetMapping
    public MeProfileResponse get(Authentication auth) {
        UUID accountId = requireAccountId(auth);
        return meProfileService.get(accountId);
    }

    @PutMapping
    public MeProfileResponse put(@Valid @RequestBody MeProfileUpdateRequest req, Authentication auth) {
        UUID accountId = requireAccountId(auth);
        return meProfileService.upsert(accountId, req);
    }

    private UUID requireAccountId(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }
        try {
            @SuppressWarnings("unchecked")
            var details = (Map<String, Object>) auth.getDetails();
            return UUID.fromString((String) details.get("aid"));
        } catch (Exception e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }
    }
}
