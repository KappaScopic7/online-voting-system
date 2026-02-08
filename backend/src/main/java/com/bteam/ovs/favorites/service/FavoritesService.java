package com.bteam.ovs.favorites.service;

import com.bteam.ovs.favorites.controller.dto.*;
import com.bteam.ovs.favorites.entity.FavoriteTargetType;
import com.bteam.ovs.favorites.entity.PortalFavorite;
import com.bteam.ovs.favorites.repository.PortalFavoriteRepository;
import com.bteam.ovs.shared.auth.AccountResolver;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class FavoritesService {

    private final PortalFavoriteRepository favoriteRepository;
    private final FavoriteTargetExistenceService existenceService;
    private final AccountResolver accountResolver;

    public FavoritesService(
            PortalFavoriteRepository favoriteRepository,
            FavoriteTargetExistenceService existenceService,
            AccountResolver accountResolver) {
        this.favoriteRepository = favoriteRepository;
        this.existenceService = existenceService;
        this.accountResolver = accountResolver;
    }

    @Transactional
    public void add(UUID accountId, FavoriteAddRequest req) {
        accountResolver.requireActiveAccount(accountId);

        FavoriteTargetType type = requireType(req.targetType());
        UUID targetId = requireUuid(req.targetId(), "targetId");

        if (!existenceService.exists(type, targetId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "TARGET_NOT_FOUND", "対象が存在しません");
        }

        // 二重登録は無視（OK扱い）にする：UIの連打に強い
        if (favoriteRepository.existsByAccountIdAndTargetTypeAndTargetId(accountId, type, targetId)) {
            return;
        }

        favoriteRepository.save(new PortalFavorite(accountId, type, targetId));
    }

    @Transactional
    public void remove(UUID accountId, FavoriteTargetType type, UUID targetId) {
        accountResolver.requireActiveAccount(accountId);
        favoriteRepository.deleteByAccountIdAndTargetTypeAndTargetId(accountId, type, targetId);
    }

    @Transactional(readOnly = true)
    public FavoriteStateResponse state(UUID accountId, FavoriteTargetType type, UUID targetId) {
        accountResolver.requireActiveAccount(accountId);
        boolean favorited = favoriteRepository.existsByAccountIdAndTargetTypeAndTargetId(accountId, type, targetId);
        return new FavoriteStateResponse(favorited);
    }

    @Transactional(readOnly = true)
    public FavoriteBulkStateResponse bulkState(UUID accountId, FavoriteBulkStateRequest req) {
        accountResolver.requireActiveAccount(accountId);

        FavoriteTargetType type = requireType(req.targetType());
        List<UUID> ids = req.targetIds() == null ? List.of() : req.targetIds();

        // 念のため null 排除
        List<UUID> cleaned = ids.stream().filter(Objects::nonNull).distinct().toList();

        Map<UUID, Boolean> states = new LinkedHashMap<>();
        for (UUID id : cleaned)
            states.put(id, false);

        if (!cleaned.isEmpty()) {
            List<PortalFavorite> hits = favoriteRepository.findByAccountIdAndTargetTypeAndTargetIdIn(accountId, type,
                    cleaned);
            for (PortalFavorite f : hits)
                states.put(f.getTargetId(), true);
        }

        return new FavoriteBulkStateResponse(states);
    }

    @Transactional(readOnly = true)
    public Page<FavoriteItem> list(UUID accountId, FavoriteTargetType typeOrNull, Pageable pageable) {
        accountResolver.requireActiveAccount(accountId);

        Page<PortalFavorite> page = (typeOrNull == null)
                ? favoriteRepository.findByAccountIdOrderByCreatedAtDesc(accountId, pageable)
                : favoriteRepository.findByAccountIdAndTargetTypeOrderByCreatedAtDesc(accountId, typeOrNull, pageable);

        return page.map(f -> new FavoriteItem(
                f.getTargetType().name(),
                f.getTargetId(),
                f.getCreatedAt()));
    }

    // ===== helpers =====

    private static FavoriteTargetType requireType(String s) {
        if (s == null || s.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "targetType が不正です");
        }
        try {
            return FavoriteTargetType.valueOf(s.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "targetType が不正です");
        }
    }

    private static UUID requireUuid(UUID v, String field) {
        if (v == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "BAD_REQUEST", field + " が不正です");
        }
        return v;
    }
}
