package com.bteam.ovs.favorites.dto.request;

import java.util.UUID;

public record FavoriteAddRequest(
        String targetType,
        UUID targetId) {
}
