package com.bteam.ovs.favorites.controller.dto;

import java.time.Instant;
import java.util.UUID;

public record ResolvedFavoriteItem(
        ResolvedFavoriteTargetType targetType,
        UUID targetId,
        Instant createdAt,
        String label,

        ResolvedElectionSummary election,
        ResolvedCandidateSummary candidate,
        ResolvedPartySummary party) {
}
