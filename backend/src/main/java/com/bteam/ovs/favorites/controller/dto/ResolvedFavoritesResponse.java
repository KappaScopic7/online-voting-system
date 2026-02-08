package com.bteam.ovs.favorites.controller.dto;

import java.util.List;

public record ResolvedFavoritesResponse(
        List<ResolvedFavoriteItem> items) {
}
