package com.bteam.ovs.elections.web;

import com.bteam.ovs.auth.repo.PortalAccountRepository;
import com.bteam.ovs.elections.repo.ElectionRepository;
import com.bteam.ovs.elections.web.dto.ElectionListItem;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.voting.repo.VoteCurrentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/voter/elections")
public class VoterElectionController {

    private final PortalAccountRepository portalRepo;
    private final ElectionRepository electionRepo;
    private final VoteCurrentRepository voteCurrentRepo;

    public VoterElectionController(
            PortalAccountRepository portalRepo,
            ElectionRepository electionRepo,
            VoteCurrentRepository voteCurrentRepo
    ) {
        this.portalRepo = portalRepo;
        this.electionRepo = electionRepo;
        this.voteCurrentRepo = voteCurrentRepo;
    }

    @GetMapping
    public List<ElectionListItem> list(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }

        var acc = portalRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        boolean identityLinked = (acc.getCitizenId() != null);

        var now = Instant.now();
        return electionRepo.findAllByOrderByStartsAtDesc().stream()
                .map(e -> {
                    boolean withinPeriod = !now.isBefore(e.getStartsAt()) && now.isBefore(e.getEndsAt());

                    // VoteCurrent がある = 現在票が存在する（再投票モデル）
                    boolean hasCurrentVote = false;
                    if (identityLinked) {
                        hasCurrentVote = voteCurrentRepo.existsByElectionIdAndCitizenId(e.getId(), acc.getCitizenId());
                    }

                    // 再投票OK：本人認証済み & 期間内なら投票(変更)可能
                    boolean canCast = identityLinked && withinPeriod;

                    return new ElectionListItem(
                            e.getId(),
                            e.getTitle(),
                            e.getStartsAt(),
                            e.getEndsAt(),
                            canCast,
                            hasCurrentVote
                    );
                })
                .toList();
    }
}
