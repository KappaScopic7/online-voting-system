package com.bteam.ovs.favorites.dto.response;

import java.util.Map;
import java.util.UUID;

public record FavoriteBulkStateResponse(
        Map<UUID, Boolean> states) {
}
