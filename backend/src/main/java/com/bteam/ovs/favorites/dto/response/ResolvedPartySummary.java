package com.bteam.ovs.favorites.dto.response;

import java.util.UUID;

public record ResolvedPartySummary(
        UUID id,
        String partyKey,
        String name,
        String shortName,
        String color) {
}
