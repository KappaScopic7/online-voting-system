package com.bteam.ovs.favorites.controller.dto;

import java.util.List;
import java.util.UUID;

public record FavoriteBulkStateRequest(
        String targetType,
        List<UUID> targetIds) {
}
