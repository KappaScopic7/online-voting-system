package com.bteam.ovs.favorites.controller.dto;

import java.time.Instant;
import java.util.UUID;

public record FavoriteItem(
        String targetType,
        UUID targetId,
        Instant createdAt) {
}
