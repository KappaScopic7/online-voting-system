package com.bteam.ovs.eligibility.service.entity;

import java.time.LocalDate;

public record EligibilitySnapshot(
        Source source,
        LocalDate birthDate,
        String prefCode,
        String cityCode
) {
    public enum Source { CITIZEN, SELF, NONE }

    public static EligibilitySnapshot none() {
        return new EligibilitySnapshot(Source.NONE, null, null, null);
    }
}
