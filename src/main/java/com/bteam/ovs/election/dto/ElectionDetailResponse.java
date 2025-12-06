package com.bteam.ovs.election.dto;

import com.bteam.ovs.election.domain.ElectionStatus;

import java.time.LocalDateTime;

public record ElectionDetailResponse(
        Long id,
        String code,
        String name,
        String description,
        String districtName,
        ElectionStatus status,
        LocalDateTime startsAt,
        LocalDateTime endsAt
) {
}
