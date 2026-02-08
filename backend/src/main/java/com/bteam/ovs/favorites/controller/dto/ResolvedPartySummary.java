package com.bteam.ovs.favorites.controller.dto;

import java.util.UUID;

public record ResolvedPartySummary(
        UUID id,
        String partyKey,
        String name,
        String shortName,
        String color) {
}
