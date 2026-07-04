package com.bteam.ovs.favorites.dto.response;

import java.util.List;

public record ResolvedFavoritesResponse(
        List<ResolvedFavoriteItem> items) {
}
