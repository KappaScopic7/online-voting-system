package com.bteam.ovs.voter.service;

import com.bteam.ovs.vote.domain.Vote;
import com.bteam.ovs.vote.repository.VoteRepository;
import com.bteam.ovs.voter.domain.VoterAccount;
import com.bteam.ovs.voter.dto.MyVoteHistoryResponse;
import com.bteam.ovs.voter.repository.VoterAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VoterVoteHistoryService {

    private final VoterAccountRepository voterAccountRepository;
    private final VoteRepository voteRepository;

    @Transactional(readOnly = true)
    public List<MyVoteHistoryResponse> getMyVoteHistory() {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "認証情報が見つかりません。");
        }

        String email = auth.getName();

        VoterAccount account = voterAccountRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "アカウントが見つかりません。"
                ));

        List<Vote> votes = voteRepository.findByVoterAccountOrderByVotedAtDesc(account);

        return votes.stream()
                .map(v -> {
                    var e = v.getElection();
                    var d = e.getDistrict();
                    var c = v.getCandidate();

                    return new MyVoteHistoryResponse(
                            e.getId(),
                            e.getCode(),
                            e.getName(),
                            d != null ? d.getName() : null,
                            e.getStatus(),
                            e.getStartsAt(),
                            e.getEndsAt(),
                            v.getId(),
                            v.getVotedAt(),
                            c != null ? c.getId() : null,
                            c != null ? c.getName() : null,
                            c != null ? c.getPartyName() : null
                    );
                })
                .toList();
    }
}
