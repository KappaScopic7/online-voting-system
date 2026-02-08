package com.bteam.ovs.favorites.controller.dto;

import java.util.Map;
import java.util.UUID;

public record FavoriteBulkStateResponse(
        Map<UUID, Boolean> states) {
}
