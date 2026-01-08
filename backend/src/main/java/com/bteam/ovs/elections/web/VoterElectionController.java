package com.bteam.ovs.elections.web;

import com.bteam.ovs.auth.repo.PortalAccountRepository;
import com.bteam.ovs.elections.repo.CandidateRepository;
import com.bteam.ovs.elections.repo.ElectionRepository;
import com.bteam.ovs.elections.web.dto.VoterElectionListItem;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.voting.repo.VoteCurrentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/elections")
public class VoterElectionController {

    private final PortalAccountRepository portalRepo;
    private final ElectionRepository electionRepo;
    private final VoteCurrentRepository voteCurrentRepo;
    private final CandidateRepository candidateRepo;

    public VoterElectionController(
            PortalAccountRepository portalRepo,
            ElectionRepository electionRepo,
            VoteCurrentRepository voteCurrentRepo,
            CandidateRepository candidateRepo
    ) {
        this.portalRepo = portalRepo;
        this.electionRepo = electionRepo;
        this.voteCurrentRepo = voteCurrentRepo;
        this.candidateRepo = candidateRepo;
    }

    @GetMapping
    public List<VoterElectionListItem> list(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }

        var acc = portalRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        var citizenId = acc.getCitizenId();
        boolean identityLinked = (citizenId != null);

        var now = Instant.now();
        var elections = electionRepo.findAllByOrderByStartsAtDesc();

        // ★ 候補名Map（candidateId -> name）
        // electionsが0件の時の無駄クエリ回避もしておく
        Map<UUID, String> candidateNameById = Collections.emptyMap();
        if (!elections.isEmpty()) {
            var electionIds = elections.stream().map(e -> e.getId()).toList();

            candidateNameById = candidateRepo.findByElectionIdIn(electionIds).stream()
                    .collect(Collectors.toMap(
                            c -> c.getId(),
                            c -> c.getName(),
                            (a, b) -> a
                    ));

            // デバッグしたいなら一時的にログ（必要なら）
            System.out.println("[DEMO] candidateNameById size=" + candidateNameById.size());
        }

        Map<UUID, String> finalCandidateNameById = candidateNameById;

        return elections.stream()
                .map(e -> {
                    String status;
                    if (now.isBefore(e.getStartsAt())) status = "UPCOMING";
                    else if (now.isAfter(e.getEndsAt())) status = "ENDED";
                    else status = "ONGOING";

                    boolean canCast = identityLinked && "ONGOING".equals(status);

                    VoterElectionListItem.CurrentVote currentVote = null;
                    if (identityLinked) {
                        var curOpt = voteCurrentRepo.findByElectionIdAndCitizenId(e.getId(), citizenId);
                        if (curOpt.isPresent()) {
                            var cur = curOpt.get();
                            var cid = cur.getCandidateId();

                            currentVote = new VoterElectionListItem.CurrentVote(
                                    cid,
                                    finalCandidateNameById.get(cid), // ★ここで埋める
                                    cur.getCastedAt()
                            );
                        }
                    }

                    return new VoterElectionListItem(
                            e.getId(),
                            e.getTitle(),
                            e.getStartsAt(),
                            e.getEndsAt(),
                            status,
                            canCast,
                            currentVote
                    );
                })
                .toList();
    }
}
