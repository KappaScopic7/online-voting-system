package com.bteam.ovs.voter.dto;

import com.bteam.ovs.voter.domain.VoterStatus;

public record VoterMeResponse(
        String email,
        VoterStatus status,
        String familyName,
        String givenName,
        String prefecture,
        String city,
        String addressLine
) {
}
