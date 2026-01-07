package com.bteam.ovs.elections.web;

import com.bteam.ovs.auth.repo.PortalAccountRepository;
import com.bteam.ovs.elections.repo.ElectionRepository;
import com.bteam.ovs.elections.web.dto.VoterElectionListItem;
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
    public List<VoterElectionListItem> list(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }

        var acc = portalRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        var citizenId = acc.getCitizenId();
        boolean identityLinked = (citizenId != null);

        var now = Instant.now();

        return electionRepo.findAllByOrderByStartsAtDesc().stream()
                .map(e -> {
                    // status
                    String status;
                    if (now.isBefore(e.getStartsAt())) status = "UPCOMING";
                    else if (now.isAfter(e.getEndsAt())) status = "ENDED";
                    else status = "ONGOING";

                    // canCast（再投票OK）
                    boolean canCast = identityLinked && "ONGOING".equals(status);

                    // currentVote（未本人認証なら常にnull）
                    VoterElectionListItem.CurrentVote currentVote = null;
                    if (identityLinked) {
                        var curOpt = voteCurrentRepo.findByElectionIdAndCitizenId(e.getId(), citizenId);
                        if (curOpt.isPresent()) {
                            var cur = curOpt.get();
                            currentVote = new VoterElectionListItem.CurrentVote(
                                    cur.getCandidateId(),
                                    null,               // joinしない方針
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
