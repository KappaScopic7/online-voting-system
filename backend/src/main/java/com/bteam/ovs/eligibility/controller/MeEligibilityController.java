package com.bteam.ovs.eligibility.controller;

import com.bteam.ovs.eligibility.dto.response.MeEligibilityResponse;
import com.bteam.ovs.eligibility.service.EligibilityProfileResolver;
// import com.bteam.ovs.shared.errors.ApiException;
// import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.bteam.ovs.shared.security.PrincipalExtractor;

// import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/me/eligibility")
public class MeEligibilityController {

    private final EligibilityProfileResolver resolver;

    public MeEligibilityController(EligibilityProfileResolver resolver) {
        this.resolver = resolver;
    }

    @GetMapping
    public MeEligibilityResponse get(Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        var snap = resolver.resolve(accountId);
        return MeEligibilityResponse.from(snap);
    }

    // private UUID requireAccountId(Authentication auth) {
    // if (auth == null || auth.getName() == null) {
    // throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
    // }
    // try {
    // @SuppressWarnings("unchecked")
    // var details = (Map<String, Object>) auth.getDetails();
    // return UUID.fromString((String) details.get("aid"));
    // } catch (Exception e) {
    // throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
    // }
    // }
}
