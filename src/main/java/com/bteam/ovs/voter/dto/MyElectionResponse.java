package com.bteam.ovs.voter.dto;

import com.bteam.ovs.election.domain.ElectionStatus;

import java.time.LocalDateTime;

public record MyElectionResponse(
        Long electionId,
        String code,
        String name,
        String districtName,
        ElectionStatus status,
        LocalDateTime startsAt,
        LocalDateTime endsAt
) {
}
