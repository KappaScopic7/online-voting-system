package com.bteam.ovs.elections.service;

import com.bteam.ovs.elections.controller.dto.CandidateDetailResponse;
import com.bteam.ovs.elections.controller.dto.CandidateItem;
import com.bteam.ovs.elections.controller.dto.ElectionDetailResponse;
import com.bteam.ovs.elections.controller.dto.ElectionListItem;
import com.bteam.ovs.elections.controller.dto.ElectionResultResponse;
import com.bteam.ovs.elections.repository.CandidateRepository;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.elections.repository.PartyRepository;
import com.bteam.ovs.shared.auth.AccountResolver;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.voting.repository.VoteCurrentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ElectionService {

    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;
    private final PartyRepository partyRepo;
    private final VoteCurrentRepository voteCurrentRepo;
    private final AccountResolver accountResolver;
    private final ElectionEligibilityService electionEligibilityService;

    public ElectionService(
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            PartyRepository partyRepo,
            VoteCurrentRepository voteCurrentRepo,
            AccountResolver accountResolver,
            ElectionEligibilityService electionEligibilityService) {
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
        this.partyRepo = partyRepo;
        this.voteCurrentRepo = voteCurrentRepo;
        this.accountResolver = accountResolver;
        this.electionEligibilityService = electionEligibilityService;
    }

    public List<ElectionListItem> list(UUID accountIdOrNull) {
        final Instant now = Instant.now();

        var elections = electionRepo.findAllByOrderByStartsAtDesc();
        if (elections.isEmpty())
            return List.of();

        var electionIds = elections.stream().map(e -> e.getId()).toList();

        // 候補者数
        Map<UUID, Long> candidateCountByElectionId = candidateRepo.countByElectionIdIn(electionIds).stream()
                .collect(Collectors.toMap(
                        CandidateRepository.ElectionCandidateCount::getElectionId,
                        CandidateRepository.ElectionCandidateCount::getCnt));

        // 現在投票の candidateName 表示用（候補者名だけ必要）
        Map<UUID, String> candidateNameById = candidateRepo.findByElectionIdIn(electionIds).stream()
                .collect(Collectors.toMap(
                        c -> c.getId(),
                        c -> c.getName(),
                        (a, b) -> a));

        // 公開API：accountIdが来ても「見つからない/無効/ロック」は未ログイン扱い
        UUID citizenId = null;
        boolean identityLinked = false;

        var accOpt = accountResolver.findActiveAccount(accountIdOrNull);
        if (accOpt.isPresent()) {
            citizenId = accOpt.get().getCitizenId();
            identityLinked = (citizenId != null);
        }

        Map<UUID, com.bteam.ovs.voting.entity.VoteCurrent> currentByElectionId = Map.of();
        if (identityLinked) {
            currentByElectionId = voteCurrentRepo.findByCitizenIdAndElectionIdIn(citizenId, electionIds).stream()
                    .collect(Collectors.toMap(
                            v -> v.getElectionId(),
                            Function.identity(),
                            (a, b) -> a));
        }

        final boolean finalIdentityLinked = identityLinked;
        final Map<UUID, com.bteam.ovs.voting.entity.VoteCurrent> finalCurrentByElectionId = currentByElectionId;

        return elections.stream()
                .map(e -> {
                    String st = status(now, e.getStartsAt(), e.getEndsAt());
                    boolean hasResult = "ENDED".equals(st);

                    long cnt = candidateCountByElectionId.getOrDefault(e.getId(), 0L);
                    int candidateCount = (cnt > Integer.MAX_VALUE) ? Integer.MAX_VALUE : (int) cnt;

                    // 投票できるのは開催中かつ本人認証済み
                    boolean canCast = finalIdentityLinked
                            && "ONGOING".equals(st)
                            && accountIdOrNull != null
                            && electionEligibilityService.isEligible(accountIdOrNull, e.getId());

                    ElectionListItem.CurrentVote currentVote = null;
                    if (finalIdentityLinked) {
                        var cur = finalCurrentByElectionId.get(e.getId());
                        if (cur != null) {
                            var cid = cur.getCandidateId();
                            currentVote = new ElectionListItem.CurrentVote(
                                    cid,
                                    candidateNameById.get(cid),
                                    cur.getCastedAt());
                        }
                    }

                    return new ElectionListItem(
                            e.getId(),
                            e.getTitle(),
                            e.getStartsAt(),
                            e.getEndsAt(),
                            st,
                            hasResult,
                            candidateCount,
                            canCast,
                            currentVote);
                })
                .toList();
    }

    public ElectionDetailResponse detail(UUID electionId, UUID accountIdOrNull) {
        final Instant now = Instant.now();

        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        String st = status(now, election.getStartsAt(), election.getEndsAt());

        // 候補者
        var candidateEntities = candidateRepo.findByElectionId(electionId);
        candidateEntities.sort(Comparator.comparingInt(c -> c.getSortOrder()));

        // ★追加：candidateId -> name（currentVote用）
        Map<UUID, String> candidateNameById = candidateEntities.stream()
                .collect(Collectors.toMap(
                        c -> c.getId(),
                        c -> c.getName(),
                        (a, b) -> a));

        var partyMap = loadPartiesByCandidateEntities(candidateEntities);

        var candidates = candidateEntities.stream()
                .map(c -> toCandidateItem(c, partyMap.get(blankToNull(c.getPartyKey()))))
                .toList();

        int candidateCount = candidates.size();

        // 公開API：accountIdが来ても「見つからない/無効/ロック」は未ログイン扱い
        boolean identityLinked = false;
        UUID citizenId = null;

        var accOpt = accountResolver.findActiveAccount(accountIdOrNull);
        if (accOpt.isPresent()) {
            citizenId = accOpt.get().getCitizenId();
            identityLinked = (citizenId != null);
        }

        boolean canCast = identityLinked && "ONGOING".equals(st);

        // 現在投票（★最適化：単発取得メソッド）
        ElectionListItem.CurrentVote currentVote = null;
        if (identityLinked) {
            var curOpt = voteCurrentRepo.findByElectionIdAndCitizenId(electionId, citizenId);
            if (curOpt.isPresent()) {
                var cur = curOpt.get();
                UUID cid = cur.getCandidateId();
                currentVote = new ElectionListItem.CurrentVote(
                        cid,
                        candidateNameById.get(cid),
                        cur.getCastedAt());
            }
        }

        return new ElectionDetailResponse(
                election.getId(),
                election.getTitle(),
                election.getStartsAt(),
                election.getEndsAt(),
                st,
                candidateCount,
                candidates,
                canCast,
                currentVote);
    }

    public List<CandidateItem> candidates(UUID electionId) {
        if (!electionRepo.existsById(electionId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません");
        }

        var candidateEntities = candidateRepo.findByElectionId(electionId);
        candidateEntities.sort(Comparator.comparingInt(c -> c.getSortOrder()));

        var partyMap = loadPartiesByCandidateEntities(candidateEntities);

        return candidateEntities.stream()
                .map(c -> toCandidateItem(c, partyMap.get(blankToNull(c.getPartyKey()))))
                .toList();
    }

    public List<CandidateItem> candidatesAll(UUID electionIdOrNull, String partyKeyOrNull) {

        List<com.bteam.ovs.elections.entity.Candidate> candidateEntities;

        if (electionIdOrNull != null) {
            if (!electionRepo.existsById(electionIdOrNull)) {
                throw new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません");
            }
            candidateEntities = candidateRepo.findByElectionId(electionIdOrNull);
            candidateEntities.sort(Comparator.comparingInt(c -> c.getSortOrder()));

        } else if (partyKeyOrNull != null && !partyKeyOrNull.isBlank()) {
            candidateEntities = candidateRepo.findByPartyKeyOrderByElectionIdAscSortOrderAsc(partyKeyOrNull.trim());

        } else {
            candidateEntities = candidateRepo.findAllByOrderByElectionIdAscSortOrderAsc();
        }

        var partyMap = loadPartiesByCandidateEntities(candidateEntities);

        return candidateEntities.stream()
                .map(c -> toCandidateItem(c, partyMap.get(blankToNull(c.getPartyKey()))))
                .toList();
    }

    public ElectionResultResponse result(UUID electionId) {
        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません"));

        var now = Instant.now();
        if (now.isBefore(election.getEndsAt())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "RESULT_NOT_AVAILABLE", "結果は選挙終了後に公開されます");
        }

        var candidates = candidateRepo.findByElectionId(electionId);

        var countMap = voteCurrentRepo.countByElectionGroupByCandidate(electionId).stream()
                .collect(Collectors.toMap(
                        VoteCurrentRepository.VoteCount::getCandidateId,
                        VoteCurrentRepository.VoteCount::getCnt));

        long totalVotes = countMap.values().stream().mapToLong(Long::longValue).sum();

        var results = candidates.stream()
                .map(c -> new ElectionResultResponse.CandidateResult(
                        c.getId(),
                        c.getName(),
                        countMap.getOrDefault(c.getId(), 0L)))
                .sorted((a, b) -> Long.compare(b.votes(), a.votes()))
                .toList();

        return new ElectionResultResponse(
                election.getId(),
                election.getTitle(),
                "CURRENT",
                totalVotes,
                now,
                results);
    }

    public static String status(Instant now, Instant startsAt, Instant endsAt) {
        if (now.isBefore(startsAt))
            return "UPCOMING";
        if (!now.isBefore(endsAt))
            return "ENDED";
        return "ONGOING";
    }

    private CandidateItem toCandidateItem(
            com.bteam.ovs.elections.entity.Candidate c,
            com.bteam.ovs.elections.entity.Party pOrNull) {

        CandidateItem.PartyEmbed party = null;
        if (pOrNull != null) {
            party = new CandidateItem.PartyEmbed(
                    pOrNull.getPartyKey(),
                    pOrNull.getShortName(),
                    pOrNull.getName(),
                    pOrNull.getColor());
        }

        return new CandidateItem(
                c.getId(),
                c.getElectionId(),
                c.getCandidateKey(),
                c.getName(),
                c.getAge(),
                c.getTitle(),
                c.getSortOrder(),
                party);
    }

    private Map<String, com.bteam.ovs.elections.entity.Party> loadPartiesByCandidateEntities(
            List<com.bteam.ovs.elections.entity.Candidate> candidateEntities) {
        var keys = candidateEntities.stream()
                .map(c -> blankToNull(c.getPartyKey()))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (keys.isEmpty())
            return Map.of();

        return partyRepo.findByPartyKeyIn(keys).stream()
                .collect(Collectors.toMap(
                        p -> p.getPartyKey(),
                        Function.identity()));
    }

    private String blankToNull(String v) {
        if (v == null)
            return null;
        var t = v.trim();
        return t.isEmpty() ? null : t;
    }

    public CandidateDetailResponse candidateDetail(UUID electionId, UUID candidateId) {
        if (!electionRepo.existsById(electionId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません");
        }

        var c = candidateRepo.findByIdAndElectionId(candidateId, electionId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "CANDIDATE_NOT_FOUND",
                        "候補者が存在しません"));

        CandidateDetailResponse.PartyEmbed party = null;

        String partyKey = blankToNull(c.getPartyKey());
        if (partyKey != null) {
            var p = partyRepo.findByPartyKey(partyKey)
                    .orElseThrow(() -> new ApiException(
                            HttpStatus.NOT_FOUND,
                            "PARTY_NOT_FOUND",
                            "政党が見つかりません: " + partyKey));

            party = new CandidateDetailResponse.PartyEmbed(
                    p.getPartyKey(),
                    p.getShortName(),
                    p.getName(),
                    p.getColor(),
                    p.getDescription(),
                    (p.getIdeologyTags() == null) ? List.of() : p.getIdeologyTags());
        }

        return new CandidateDetailResponse(
                c.getId(),
                c.getElectionId(),
                c.getCandidateKey(),
                c.getName(),
                c.getAge(),
                c.getTitle(),
                c.getBio(),
                (c.getPolicies() == null) ? List.of() : c.getPolicies(),
                c.getWebsiteUrl(),
                c.getImageUrl(),
                party);
    }

}