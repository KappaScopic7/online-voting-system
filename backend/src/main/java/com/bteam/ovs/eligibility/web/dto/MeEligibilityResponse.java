package com.bteam.ovs.eligibility.web.dto;

import com.bteam.ovs.eligibility.service.model.EligibilitySnapshot;

import java.time.LocalDate;

public record MeEligibilityResponse(
        String source,       // "SELF" | "CITIZEN" | "NONE"
        LocalDate birthDate,
        String prefCode,
        String cityCode
) {
    public static MeEligibilityResponse from(EligibilitySnapshot s) {
        return new MeEligibilityResponse(
                s.source().name(),
                s.birthDate(),
                s.prefCode(),
                s.cityCode()
        );
    }
}
