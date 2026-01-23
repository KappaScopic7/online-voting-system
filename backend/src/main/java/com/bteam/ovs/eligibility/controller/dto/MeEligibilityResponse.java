package com.bteam.ovs.eligibility.controller.dto;

import java.time.LocalDate;

import com.bteam.ovs.eligibility.service.entity.EligibilitySnapshot;

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
