package com.bteam.ovs.identity.controller.dto;

public record CitizenNfcResolveResponse(
        String citizenId,
        String familyName,
        String givenName,
        String birthDate,
        String prefCode,
        String cityCode,
        String addressLine,
        String gender) {
}
