package com.bteam.ovs.elections.service;

import com.bteam.ovs.auth.repo.PortalAccountRepository;
import com.bteam.ovs.elections.repo.CandidateRepository;
import com.bteam.ovs.elections.repo.ElectionRepository;
import com.bteam.ovs.elections.web.dto.ElectionListItem;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.voting.repo.VoteCurrentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ElectionService {

    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;
    private final VoteCurrentRepository voteCurrentRepo;
    private final PortalAccountRepository portalRepo;

    public ElectionService(
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            VoteCurrentRepository voteCurrentRepo,
            PortalAccountRepository portalRepo
    ) {
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
        this.voteCurrentRepo = voteCurrentRepo;
        this.portalRepo = portalRepo;
    }

    public List<ElectionListItem> list(UUID accountIdOrNull) {
        var now = Instant.now();

        var elections = electionRepo.findAllByOrderByStartsAtDesc();
        if (elections.isEmpty()) return List.of();

        var electionIds = elections.stream().map(e -> e.getId()).toList();

        var countMap = candidateRepo.countByElectionIdIn(electionIds).stream()
                .collect(Collectors.toMap(
                        CandidateRepository.ElectionCandidateCount::getElectionId,
                        CandidateRepository.ElectionCandidateCount::getCnt
                ));

        var candidateNameById = candidateRepo.findByElectionIdIn(electionIds).stream()
                .collect(Collectors.toMap(
                        c -> c.getId(),
                        c -> c.getName(),
                        (a, b) -> a
                ));

        UUID citizenId = null;
        boolean identityLinked = false;

        if (accountIdOrNull != null) {
            var acc = portalRepo.findById(accountIdOrNull)
                    .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));
            citizenId = acc.getCitizenId();
            identityLinked = (citizenId != null);
        }

        Map<UUID, com.bteam.ovs.voting.model.VoteCurrent> currentByElectionId = Map.of();
        if (identityLinked) {
            currentByElectionId = voteCurrentRepo.findByCitizenIdAndElectionIdIn(citizenId, electionIds).stream()
                    .collect(Collectors.toMap(
                            v -> v.getElectionId(),
                            v -> v,
                            (a, b) -> a
                    ));
        }

        var finalIdentityLinked = identityLinked;
        var finalCurrentByElectionId = currentByElectionId;

        return elections.stream()
                .map(e -> {
                    String st = status(now, e.getStartsAt(), e.getEndsAt());
                    boolean hasResult = "ENDED".equals(st);
                    int candidateCount = Math.toIntExact(countMap.getOrDefault(e.getId(), 0L));

                    boolean canCast = finalIdentityLinked && "ONGOING".equals(st);

                    ElectionListItem.CurrentVote currentVote = null;
                    if (finalIdentityLinked) {
                        var cur = finalCurrentByElectionId.get(e.getId());
                        if (cur != null) {
                            var cid = cur.getCandidateId();
                            currentVote = new ElectionListItem.CurrentVote(
                                    cid,
                                    candidateNameById.get(cid),
                                    cur.getCastedAt()
                            );
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
                            currentVote
                    );
                })
                .toList();
    }

    public static String status(Instant now, Instant startsAt, Instant endsAt) {
        if (now.isBefore(startsAt)) return "UPCOMING";
        if (!now.isBefore(endsAt)) return "ENDED";
        return "ONGOING";
    }
}
