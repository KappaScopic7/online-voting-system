package com.bteam.ovs.elections.web;

import com.bteam.ovs.auth.repo.PortalAccountRepository;
import com.bteam.ovs.elections.repo.CandidateRepository;
import com.bteam.ovs.elections.repo.ElectionRepository;
import com.bteam.ovs.elections.web.dto.CandidateItem;
import com.bteam.ovs.shared.errors.ApiException;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/voter/elections")
public class VoterElectionCandidateController {

    private final PortalAccountRepository portalRepo;
    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;

    public VoterElectionCandidateController(
            PortalAccountRepository portalRepo,
            ElectionRepository electionRepo,
            CandidateRepository candidateRepo
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
