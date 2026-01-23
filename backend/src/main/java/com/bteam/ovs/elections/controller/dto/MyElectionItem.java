package com.bteam.ovs.elections.controller.dto;

import java.time.Instant;
import java.util.UUID;

public record MyElectionItem(
        UUID electionId,
        String title,
        Instant startsAt,
        Instant endsAt
) {}
