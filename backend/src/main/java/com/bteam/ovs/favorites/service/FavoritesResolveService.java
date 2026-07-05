package com.bteam.ovs.favorites.service;

import com.bteam.ovs.candidates.entity.Candidate;
import com.bteam.ovs.candidates.repository.CandidateRepository;
import com.bteam.ovs.elections.entity.Election;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.favorites.dto.response.ResolvedCandidateSummary;
import com.bteam.ovs.favorites.dto.response.ResolvedElectionSummary;
import com.bteam.ovs.favorites.dto.response.ResolvedFavoriteItem;
import com.bteam.ovs.favorites.dto.response.ResolvedFavoriteTargetType;
import com.bteam.ovs.favorites.dto.response.ResolvedPartySummary;
import com.bteam.ovs.favorites.entity.FavoriteTargetType;
import com.bteam.ovs.favorites.entity.PortalFavorite;
import com.bteam.ovs.favorites.repository.PortalFavoriteRepository;
import com.bteam.ovs.parties.entity.Party;
import com.bteam.ovs.parties.repository.PartyRepository;
import com.bteam.ovs.shared.auth.AccountResolver;

import lombok.AllArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@AllArgsConstructor
@Service
public class FavoritesResolveService {

    private final PortalFavoriteRepository favoriteRepository;
    private final ElectionRepository electionRepository;
    private final CandidateRepository candidateRepository;
    private final PartyRepository partyRepository;
    private final AccountResolver accountResolver;

    @Transactional(readOnly = true)
    public List<ResolvedFavoriteItem> listResolved(UUID accountId) {
        accountResolver.requireActiveAccount(accountId);

        List<PortalFavorite> favs = favoriteRepository.findByAccountIdOrderByCreatedAtDesc(accountId);
        if (favs.isEmpty())
            return List.of();

        // type別に targetId を集める
        Map<FavoriteTargetType, List<UUID>> idsByType = favs.stream()
                .collect(Collectors.groupingBy(
                        PortalFavorite::getTargetType,
                        () -> new EnumMap<>(FavoriteTargetType.class),
                        Collectors.mapping(PortalFavorite::getTargetId, Collectors.toList())));

        Map<UUID, Election> elections = mapById(
                electionRepository.findAllById(distinct(idsByType.get(FavoriteTargetType.ELECTION))));
        Map<UUID, Candidate> candidates = mapById(
                candidateRepository.findAllById(distinct(idsByType.get(FavoriteTargetType.CANDIDATE))));
        Map<UUID, Party> parties = mapById(
                partyRepository.findAllById(distinct(idsByType.get(FavoriteTargetType.PARTY))));

        List<ResolvedFavoriteItem> out = new ArrayList<>(favs.size());

        for (PortalFavorite f : favs) {
            FavoriteTargetType t = f.getTargetType();
            UUID id = f.getTargetId();

            ResolvedElectionSummary eSum = null;
            ResolvedCandidateSummary cSum = null;
            ResolvedPartySummary pSum = null;
            String label;

            switch (t) {
                case ELECTION -> {
                    Election e = elections.get(id);
                    if (e == null) {
                        label = id.toString();
                    } else {
                        eSum = new ResolvedElectionSummary(
                                e.getId(),
                                e.getElectionKey(),
                                e.getTitle(),
                                e.getDistrictLabel(),
                                e.getStartsAt(),
                                e.getEndsAt());
                        label = e.getTitle();
                    }
                }
                case CANDIDATE -> {
                    Candidate c = candidates.get(id);
                    if (c == null) {
                        label = id.toString();
                    } else {
                        cSum = new ResolvedCandidateSummary(
                                c.getId(),
                                c.getElectionId(),
                                c.getCandidateKey(),
                                c.getName(),
                                c.getAge(),
                                c.getTitle(),
                                c.getPartyKey(),
                                c.getSortOrder());
                        // 一覧で強いのは name
                        label = c.getName();
                    }
                }
                case PARTY -> {
                    Party p = parties.get(id);
                    if (p == null) {
                        label = id.toString();
                    } else {
                        pSum = new ResolvedPartySummary(
                                p.getId(),
                                p.getPartyKey(),
                                p.getName(),
                                p.getShortName(),
                                p.getColor());
                        // 一覧では shortName を優先（短くて見やすい）
                        label = (p.getShortName() != null && !p.getShortName().isBlank()) ? p.getShortName()
                                : p.getName();
                    }
                }
                default -> label = id.toString();
            }

            out.add(new ResolvedFavoriteItem(
                    toResolvedType(t),
                    id,
                    f.getCreatedAt(),
                    label,
                    eSum,
                    cSum,
                    pSum));
        }

        return out;
    }

    private static ResolvedFavoriteTargetType toResolvedType(FavoriteTargetType t) {
        return switch (t) {
            case ELECTION -> ResolvedFavoriteTargetType.ELECTION;
            case CANDIDATE -> ResolvedFavoriteTargetType.CANDIDATE;
            case PARTY -> ResolvedFavoriteTargetType.PARTY;
        };
    }

    private static <T> Map<UUID, T> mapById(List<T> list) {
        return list.stream().collect(Collectors.toMap(
                FavoritesResolveService::extractId,
                Function.identity(),
                (a, b) -> a));
    }

    private static UUID extractId(Object entity) {
        try {
            return (UUID) entity.getClass().getMethod("getId").invoke(entity);
        } catch (Exception e) {
            throw new IllegalStateException("Entity must have getId(): " + entity.getClass().getName(), e);
        }
    }

    private static List<UUID> distinct(List<UUID> ids) {
        if (ids == null || ids.isEmpty())
            return List.of();
        return ids.stream().filter(Objects::nonNull).distinct().toList();
    }
}
