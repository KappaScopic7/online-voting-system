package com.bteam.ovs.election.api;

import com.bteam.ovs.auth.infra.jpa.PortalAccountJpaRepository;
import com.bteam.ovs.common.errors.ApiException;
import com.bteam.ovs.election.api.dto.ElectionListItem;
import com.bteam.ovs.election.infra.jpa.ElectionJpaRepository;
import com.bteam.ovs.voting.infra.jpa.VoteJpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/voter/elections")
public class VoterElectionController {

    private final PortalAccountJpaRepository portalRepo;
    private final ElectionJpaRepository electionRepo;
    private final VoteJpaRepository voteRepo;

    public VoterElectionController(
            PortalAccountJpaRepository portalRepo,
            ElectionJpaRepository electionRepo,
            VoteJpaRepository voteRepo
    ) {
        this.portalRepo = portalRepo;
        this.electionRepo = electionRepo;
        this.voteRepo = voteRepo;
    }

    @GetMapping
    public List<ElectionListItem> list(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }

        var acc = portalRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (acc.getCitizenId() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "IDENTITY_NOT_LINKED", "本人認証が完了していません");
        }

        var now = Instant.now();
        return electionRepo.findAll().stream()
                .map(e -> {
                    boolean withinPeriod = !now.isBefore(e.getStartsAt()) && now.isBefore(e.getEndsAt());
                    boolean alreadyVoted = voteRepo.findByElectionIdAndCitizenId(e.getId(), acc.getCitizenId()).isPresent();
                    boolean canVote = withinPeriod && !alreadyVoted;
                    return new ElectionListItem(e.getId(), e.getTitle(), e.getStartsAt(), e.getEndsAt(), canVote, alreadyVoted);
                })
                .toList();
    }
}
