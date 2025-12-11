package com.bteam.ovs.election.web;

import com.bteam.ovs.election.domain.Candidate;
import com.bteam.ovs.election.domain.Election;
import com.bteam.ovs.election.dto.CandidateResponse;
import com.bteam.ovs.election.dto.ElectionDetailResponse;
import com.bteam.ovs.election.repository.CandidateRepository;
import com.bteam.ovs.election.repository.ElectionRepository;
import com.bteam.ovs.election.service.ElectionQueryService;
import com.bteam.ovs.vote.dto.ElectionResultItemResponse;
import com.bteam.ovs.vote.service.VoteService;
import com.bteam.ovs.voter.domain.VoterAccount;
import com.bteam.ovs.voter.repository.VoterAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/api/elections")
@RequiredArgsConstructor
public class ElectionController {

    private final ElectionQueryService electionQueryService;
    private final ElectionRepository electionRepository;
    private final CandidateRepository candidateRepository;
    private final VoterAccountRepository voterAccountRepository;
    private final VoteService voteService;

    @GetMapping("/{id}")
    public ElectionDetailResponse getElection(@PathVariable Long id) {
        return electionQueryService.getElectionDetailForCurrentVoter(id);
    }

    @GetMapping("/{id}/candidates")
    public List<CandidateResponse> getCandidates(@PathVariable Long id) {
        VoterAccount voter = getCurrentVoter();

        Election election = electionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "選挙が見つかりません。"));

        if (voter.getCitizen() == null
                || voter.getCitizen().getDistrict() == null
                || election.getDistrict() == null
                || !voter.getCitizen().getDistrict().getId().equals(election.getDistrict().getId())) {
            throw new ResponseStatusException(FORBIDDEN, "この選挙にはアクセスできません。");
        }

        List<Candidate> candidates = candidateRepository.findByElectionOrderByDisplayOrderAsc(election);

        return candidates.stream()
                .map(c -> new CandidateResponse(
                        c.getId(),
                        c.getName(),
                        c.getPartyName(),
                        c.getProfile()
                ))
                .toList();
    }

    @GetMapping("/{id}/results")
    public List<ElectionResultItemResponse> getResults(@PathVariable Long id) {
        return voteService.getElectionResult(id);
    }

    private VoterAccount getCurrentVoter() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "認証情報が見つかりません。");
        }

        String email = auth.getName();

        return voterAccountRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "アカウントが見つかりません。"));
    }
}
