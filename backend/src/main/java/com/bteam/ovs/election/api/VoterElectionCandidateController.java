package com.bteam.ovs.election.api;

import com.bteam.ovs.auth.infra.jpa.PortalAccountJpaRepository;
import com.bteam.ovs.common.errors.ApiException;
import com.bteam.ovs.election.api.dto.CandidateItem;
import com.bteam.ovs.election.infra.jpa.CandidateJpaRepository;
import com.bteam.ovs.election.infra.jpa.ElectionJpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/voter/elections")
public class VoterElectionCandidateController {

    private final PortalAccountJpaRepository portalRepo;
    private final ElectionJpaRepository electionRepo;
    private final CandidateJpaRepository candidateRepo;

    public VoterElectionCandidateController(
            PortalAccountJpaRepository portalRepo,
            ElectionJpaRepository electionRepo,
            CandidateJpaRepository candidateRepo
    ) {
        this.portalRepo = portalRepo;
        this.electionRepo = electionRepo;
        this.candidateRepo = candidateRepo;
    }

    @GetMapping("/{electionId}/candidates")
    public List<CandidateItem> candidates(@PathVariable UUID electionId, Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }

        var acc = portalRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (acc.getCitizenId() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "IDENTITY_NOT_LINKED", "本人認証が完了していません");
        }

        if (!electionRepo.existsById(electionId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません");
        }

        return candidateRepo.findByElectionId(electionId).stream()
                .map(c -> new CandidateItem(c.getId(), c.getName()))
                .toList();
    }
}
