package com.bteam.ovs.elections.web;

import com.bteam.ovs.auth.repo.PortalAccountRepository;
import com.bteam.ovs.elections.repo.CandidateRepository;
import com.bteam.ovs.elections.repo.ElectionRepository;
import com.bteam.ovs.elections.web.dto.ElectionListItem;
import com.bteam.ovs.voting.repo.VoteCurrentRepository;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/elections")
public class ElectionsController {

    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;
    private final VoteCurrentRepository voteCurrentRepo;
    private final PortalAccountRepository portalRepo;

    public ElectionsController(
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

    @GetMapping
    public List<ElectionListItem> list(Authentication auth) {
        var now = Instant.now();

        var elections = electionRepo.findAllByOrderByStartsAtDesc();
        if (elections.isEmpty()) return List.of();

        var electionIds = elections.stream().map(e -> e.getId()).toList();

        // candidateCount を一括集計（あなたが入れたN+1対策を利用）
        var countMap = candidateRepo.countByElectionIdIn(electionIds).stream()
                .collect(Collectors.toMap(
                        CandidateRepository.ElectionCandidateCount::getElectionId,
                        CandidateRepository.ElectionCandidateCount::getCnt
                ));

        // 候補名を一括で取っておく（currentVote.candidateName 用）
        var candidateNameById = candidateRepo.findByElectionIdIn(electionIds).stream()
                .collect(Collectors.toMap(
                        c -> c.getId(),
                        c -> c.getName(),
                        (a, b) -> a
                ));

        // ログインしてなければ public 相当で返す
        if (auth == null || auth.getName() == null) {
            return elections.stream()
                    .map(e -> {
                        String status = statusa(now, e.getStartsAt(), e.getEndsAt());
                        boolean hasResult = "ENDED".equals(status);
                        int candidateCount = Math.toIntExact(countMap.getOrDefault(e.getId(), 0L));
                        return new ElectionListItem(
                                e.getId(),
                                e.getTitle(),
                                e.getStartsAt(),
                                e.getEndsAt(),
                                status,
                                hasResult,
                                candidateCount,
                                false,
                                null
                        );
                    })
                    .toList();
        }

        // ログイン済み → citizenId を取る（無ければ本人リンク未）
        var accOpt = portalRepo.findByEmail(auth.getName());
        var citizenId = accOpt.map(a -> a.getCitizenId()).orElse(null);
        boolean identityLinked = (citizenId != null);

        // 本人リンク済みなら、currentVote を一括で取得（N+1回避）
        Map<UUID, com.bteam.ovs.voting.model.VoteCurrent> currentByElectionId = Map.of();
        if (identityLinked) {
            currentByElectionId = voteCurrentRepo.findByCitizenIdAndElectionIdIn(citizenId, electionIds).stream()
                    .collect(Collectors.toMap(
                            v -> v.getElectionId(),
                            v -> v,
                            (a, b) -> a
                    ));
        }

        var finalCurrentByElectionId = currentByElectionId;

        return elections.stream()
                .map(e -> {
                    String status = statusa(now, e.getStartsAt(), e.getEndsAt());
                    boolean hasResult = "ENDED".equals(status);
                    int candidateCount = Math.toIntExact(countMap.getOrDefault(e.getId(), 0L));

                    boolean canCast = identityLinked && "ONGOING".equals(status);

                    ElectionListItem.CurrentVote currentVote = null;
                    if (identityLinked) {
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
                            status,
                            hasResult,
                            candidateCount,
                            canCast,
                            currentVote
                    );
                })
                .toList();
    }

    private static String statusa(Instant now, Instant startsAt, Instant endsAt) {
        if (now.isBefore(startsAt)) return "UPCOMING";
        if (now.isAfter(endsAt)) return "ENDED";
        return "ONGOING";
    }
}
