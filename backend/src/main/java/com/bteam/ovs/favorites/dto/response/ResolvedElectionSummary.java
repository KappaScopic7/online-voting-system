package com.bteam.ovs.favorites.dto.response;

import java.time.Instant;
import java.util.UUID;

public record ResolvedElectionSummary(
        UUID id,
        String electionKey,
        String title,
        String districtLabel,
        Instant startsAt,
        Instant endsAt) {
}
