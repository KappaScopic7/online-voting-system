package com.bteam.ovs.elections.controller.dto;

import com.bteam.ovs.elections.entity.BallotType;
import com.bteam.ovs.elections.entity.ElectionStatus;
import com.bteam.ovs.elections.entity.ElectionType;
import com.bteam.ovs.elections.entity.AllocationTarget;

import java.time.Instant;
import java.util.UUID;

public record CommitteeElectionListItem(
        UUID id,
        String electionKey,
        String title,
        String summary,

        ElectionType electionType,
        BallotType ballotType,
        AllocationTarget allocationTarget,

        String districtPrefCode,
        String districtCityCode,
        String districtLabel,

        Instant startsAt,
        Instant endsAt,

        ElectionStatus status,
        Instant talliedAt,
        Instant publishedAt) {
}
