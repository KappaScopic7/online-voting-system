package com.bteam.ovs.elections.service;

import com.bteam.ovs.auth.repository.UserAccountRepository;
import com.bteam.ovs.elections.controller.dto.CandidateItem;
import com.bteam.ovs.elections.controller.dto.ElectionListItem;
import com.bteam.ovs.elections.controller.dto.ElectionResultResponse;
import com.bteam.ovs.elections.controller.dto.ElectionDetailResponse;
import com.bteam.ovs.elections.repository.CandidateRepository;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.voting.repository.VoteCurrentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ElectionService {

    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;
    private final VoteCurrentRepository voteCurrentRepo;
    private final UserAccountRepository userRepo;

    public ElectionService(
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            VoteCurrentRepository voteCurrentRepo,
            UserAccountRepository userRepo) {
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
        this.voteCurrentRepo = voteCurrentRepo;
        this.userRepo = userRepo;
    }

    public List<ElectionListItem> list(UUID accountIdOrNull) {
        final Instant now = Instant.now();

        var elections = electionRepo.findAllByOrderByStartsAtDesc();
        if (elections.isEmpty())
            return List.of();

        var electionIds = elections.stream().map(e -> e.getId()).toList();

        Map<UUID, Long> candidateCountByElectionId = candidateRepo.countByElectionIdIn(electionIds).stream()
                .collect(Collectors.toMap(
                        CandidateRepository.ElectionCandidateCount::getElectionId,
                        CandidateRepository.ElectionCandidateCount::getCnt));

        Map<UUID, String> candidateNameById = candidateRepo.findByElectionIdIn(electionIds).stream()
                .collect(Collectors.toMap(
                        c -> c.getId(),
                        c -> c.getName(),
                        (a, b) -> a));

        UUID citizenId = null;
        boolean identityLinked = false;

        if (accountIdOrNull != null) {
            var acc = userRepo.findById(accountIdOrNull)
                    .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));
            citizenId = acc.getCitizenId();
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

                    boolean canCast = finalIdentityLinked && "ONGOING".equals(st);

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
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "ELECTION_NOT_FOUND",
                        "選挙が存在しません"));

        String st = status(now, election.getStartsAt(), election.getEndsAt());

        // 候補者
        var candidateEntities = candidateRepo.findByElectionId(electionId);
        var candidates = candidateEntities.stream()
                .map(c -> new CandidateItem(c.getId(), c.getName()))
                .toList();

        int candidateCount = candidates.size();

        // 認証・本人確認
        boolean identityLinked = false;
        UUID citizenId = null;

        if (accountIdOrNull != null) {
            var acc = userRepo.findById(accountIdOrNull)
                    .orElseThrow(() -> new ApiException(
                            HttpStatus.UNAUTHORIZED,
                            "UNAUTHORIZED",
                            "未ログインです"));
            citizenId = acc.getCitizenId();
            identityLinked = (citizenId != null);
        }

        boolean canCast = identityLinked && "ONGOING".equals(st);

        // 現在投票
        ElectionListItem.CurrentVote currentVote = null;
        if (identityLinked) {
            var curOpt = voteCurrentRepo
                    .findByCitizenIdAndElectionIdIn(citizenId, List.of(electionId))
                    .stream()
                    .findFirst();

            if (curOpt.isPresent()) {
                var cur = curOpt.get();
                UUID cid = cur.getCandidateId();

                String candidateName = candidates.stream()
                        .filter(c -> c.id().equals(cid))
                        .map(CandidateItem::name)
                        .findFirst()
                        .orElse(null);

                currentVote = new ElectionListItem.CurrentVote(
                        cid,
                        candidateName,
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

        return candidateRepo.findByElectionId(electionId).stream()
                .map(c -> new CandidateItem(c.getId(), c.getName()))
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
}
