package com.bteam.ovs.voters.service;

import com.bteam.ovs.elections.model.Election;
import com.bteam.ovs.elections.repo.CandidateRepository;
import com.bteam.ovs.elections.repo.ElectionRepository;
import com.bteam.ovs.elections.web.dto.ElectionListItem;
import com.bteam.ovs.voting.model.VoteCurrent;
import com.bteam.ovs.voting.repo.VoteCurrentRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VoterElectionsService {

    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;
    private final VoteCurrentRepository voteCurrentRepo;

    public VoterElectionsService(
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo,
            VoteCurrentRepository voteCurrentRepo
    ) {
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
        this.voteCurrentRepo = voteCurrentRepo;
    }

    public List<ElectionListItem> listMyElections(UUID citizenId) {
        // NOTE: 現状は "全選挙" を返す（UC_21の精緻化は後で）
        List<Election> elections = electionRepo.findAll();
        if (elections.isEmpty()) return List.of();

        List<UUID> electionIds = elections.stream().map(Election::getId).toList();

        // candidateCount（まとめて集計）
        Map<UUID, Long> candidateCounts = candidateRepo.countByElectionIdIn(electionIds).stream()
                .collect(Collectors.toMap(
                        CandidateRepository.ElectionCandidateCount::getElectionId,
                        CandidateRepository.ElectionCandidateCount::getCnt
                ));

        // currentVote（まとめて取得）
        List<VoteCurrent> currents = voteCurrentRepo.findByCitizenIdAndElectionIdIn(citizenId, electionIds);
        Map<UUID, VoteCurrent> currentByElectionId = new HashMap<>();
        for (VoteCurrent v : currents) {
            currentByElectionId.put(v.getElectionId(), v);
        }

        // currentVote の candidateName を引くため Candidate をまとめて取る
        Set<UUID> candidateIds = currents.stream()
                .map(VoteCurrent::getCandidateId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, String> candidateNameById = new HashMap<>();
        if (!candidateIds.isEmpty()) {
            candidateRepo.findAllById(candidateIds).forEach(c ->
                    candidateNameById.put(c.getId(), c.getName())
            );
        }

        Instant now = Instant.now();

        return elections.stream()
                .map(e -> {
                    String status = calcStatus(e, now);

                    boolean hasResult = false; // TODO: result公開ロジック（後でexistsByElectionIdInなど）
                    boolean canCast = "ONGOING".equals(status);

                    int candidateCount = Math.toIntExact(candidateCounts.getOrDefault(e.getId(), 0L));

                    VoteCurrent v = currentByElectionId.get(e.getId());
                    ElectionListItem.CurrentVote currentVote = null;
                    if (v != null) {
                        UUID cid = v.getCandidateId();
                        String cname = cid == null ? null : candidateNameById.get(cid);
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
                            currentVote
                    );
                })
                // 並び：開催中→予定→終了、同順位なら開始日時
                .sorted((a, b) -> {
                    int ra = statusRank(a.status());
                    int rb = statusRank(b.status());
                    if (ra != rb) return Integer.compare(ra, rb);
                    return String.valueOf(a.startsAt()).compareTo(String.valueOf(b.startsAt()));
                })
                .toList();
    }

    private String calcStatus(Election e, Instant now) {
        if (now.isBefore(e.getStartsAt())) return "UPCOMING";
        if (now.isAfter(e.getEndsAt())) return "ENDED";
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
