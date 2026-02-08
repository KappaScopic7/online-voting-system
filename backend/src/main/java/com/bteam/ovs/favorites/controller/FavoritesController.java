package com.bteam.ovs.favorites.controller;

import com.bteam.ovs.favorites.controller.dto.*;
import com.bteam.ovs.favorites.entity.FavoriteTargetType;
import com.bteam.ovs.favorites.service.FavoritesService;
import com.bteam.ovs.shared.security.PrincipalExtractor;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.bteam.ovs.favorites.service.FavoritesResolveService;

import java.util.UUID;

@RestController
@RequestMapping("/api/favorites")
public class FavoritesController {

    private final FavoritesService favoritesService;
    private final FavoritesResolveService resolveService;

    public FavoritesController(FavoritesService favoritesService, FavoritesResolveService resolveService) {
        this.favoritesService = favoritesService;
        this.resolveService = resolveService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void add(@RequestBody FavoriteAddRequest req, Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        favoritesService.add(accountId, req);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(
            @RequestParam("targetType") String targetType,
            @RequestParam("targetId") UUID targetId,
            Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        FavoriteTargetType type = parseType(targetType);
        favoritesService.remove(accountId, type, targetId);
    }

    @GetMapping("/state")
    public FavoriteStateResponse state(
            @RequestParam("targetType") String targetType,
            @RequestParam("targetId") UUID targetId,
            Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        FavoriteTargetType type = parseType(targetType);
        return favoritesService.state(accountId, type, targetId);
    }

    @PostMapping("/state/bulk")
    public FavoriteBulkStateResponse bulkState(
            @RequestBody FavoriteBulkStateRequest req,
            Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        return favoritesService.bulkState(accountId, req);
    }

    /**
     * GET /api/favorites
     * GET /api/favorites?targetType=ELECTION
     */
    @GetMapping
    public Page<FavoriteItem> list(
            @RequestParam(value = "targetType", required = false) String targetType,
            Pageable pageable,
            Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        FavoriteTargetType typeOrNull = (targetType == null || targetType.isBlank()) ? null : parseType(targetType);
        return favoritesService.list(accountId, typeOrNull, pageable);
    }

    @GetMapping("/resolved")
    public ResolvedFavoritesResponse resolved(Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        return new ResolvedFavoritesResponse(resolveService.listResolved(accountId));
    }

    private static FavoriteTargetType parseType(String s) {
        if (s == null || s.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "targetType が不正です");
        }
        try {
            return FavoriteTargetType.valueOf(s.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "targetType が不正です");
        }
    }
}
