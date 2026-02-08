package com.bteam.ovs.favorites.controller.dto;

import java.util.UUID;

public record FavoriteAddRequest(
        String targetType,
        UUID targetId) {
}
