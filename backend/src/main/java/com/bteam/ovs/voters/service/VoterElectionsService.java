package com.bteam.ovs.voters.service;

import com.bteam.ovs.candidates.repository.CandidateRepository;
import com.bteam.ovs.elections.controller.dto.ElectionListItem;
import com.bteam.ovs.elections.entity.Election;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.shared.identity.CitizenIdResolver;
import com.bteam.ovs.voting.entity.VoteCurrent;
import com.bteam.ovs.voting.repository.VoteCurrentRepository;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VoterElectionsService {

    private final CitizenIdResolver citizenIdResolver;
    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;
    private final VoteCurrentRepository voteCurrentRepo;

    public VoterElectionsService(
            CitizenIdResolver citizenIdResolver,
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            VoteCurrentRepository voteCurrentRepo) {
        this.citizenIdResolver = citizenIdResolver;
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
        this.voteCurrentRepo = voteCurrentRepo;
    }

    // accountId版：Controllerはこれだけ呼べばいい
    public List<ElectionListItem> listMyElectionsByAccount(UUID accountId) {
        UUID citizenId = citizenIdResolver.requireCitizenId(accountId);
        return listMyElectionsByCitizen(citizenId);
    }

    // citizenId版：既存ロジック（維持）
    public List<ElectionListItem> listMyElectionsByCitizen(UUID citizenId) {
        List<Election> elections = electionRepo.findAll();
        if (elections.isEmpty())
            return List.of();

        List<UUID> electionIds = elections.stream().map(Election::getId).toList();

        Map<UUID, Long> candidateCounts = candidateRepo.countByElectionIdIn(electionIds).stream()
                .collect(Collectors.toMap(
                        CandidateRepository.ElectionCandidateCount::getElectionId,
                        CandidateRepository.ElectionCandidateCount::getCnt));

        List<VoteCurrent> currents = voteCurrentRepo.findByCitizenIdAndElectionIdIn(citizenId, electionIds);
        Map<UUID, VoteCurrent> currentByElectionId = new HashMap<>();
        for (VoteCurrent v : currents) {
            currentByElectionId.put(v.getElectionId(), v);
        }

        Set<UUID> candidateIds = currents.stream()
                .map(VoteCurrent::getCandidateId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, String> candidateNameById = new HashMap<>();
        if (!candidateIds.isEmpty()) {
            candidateRepo.findAllById(candidateIds)
                    .forEach(c -> candidateNameById.put(c.getId(), c.getName()));
        }

        Instant now = Instant.now();

        return elections.stream()
                .map(e -> {
                    String status = calcStatus(e, now);

                    boolean hasResult = false;
                    boolean canCast = "ONGOING".equals(status);

                    int candidateCount = Math.toIntExact(candidateCounts.getOrDefault(e.getId(), 0L));

                    VoteCurrent v = currentByElectionId.get(e.getId());
                    ElectionListItem.CurrentVote currentVote = null;
                    if (v != null) {
                        UUID cid = v.getCandidateId();
                        String cname = (cid == null) ? null : candidateNameById.get(cid);
                        currentVote = new ElectionListItem.CurrentVote(cid, cname, v.getCastedAt());
                    }

                    return new ElectionListItem(
                            e.getId(),
                            e.getTitle(),
                            e.getStartsAt(),
                            e.getEndsAt(),
                            status,
                            hasResult,
                            candidateCount,
                            canCast,
                            currentVote);
                })
                .sorted((a, b) -> {
                    int ra = statusRank(a.status());
                    int rb = statusRank(b.status());
                    if (ra != rb)
                        return Integer.compare(ra, rb);
                    return String.valueOf(a.startsAt()).compareTo(String.valueOf(b.startsAt()));
                })
                .toList();
    }

    private String calcStatus(Election e, Instant now) {
        if (now.isBefore(e.getStartsAt()))
            return "UPCOMING";
        if (now.isAfter(e.getEndsAt()))
            return "ENDED";
        return "ONGOING";
    }

    private int statusRank(String s) {
        return switch (s) {
            case "ONGOING" -> 0;
            case "UPCOMING" -> 1;
            case "ENDED" -> 2;
            default -> 9;
        };
    }
}
