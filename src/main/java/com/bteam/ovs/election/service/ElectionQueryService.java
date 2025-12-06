package com.bteam.ovs.election.service;

import com.bteam.ovs.election.domain.Election;
import com.bteam.ovs.election.dto.ElectionDetailResponse;
import com.bteam.ovs.election.repository.ElectionRepository;
import com.bteam.ovs.voter.domain.VoterAccount;
import com.bteam.ovs.voter.repository.VoterAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.*;

@Service
@RequiredArgsConstructor
public class ElectionQueryService {

    private final ElectionRepository electionRepository;
    private final VoterAccountRepository voterAccountRepository;

    @Transactional(readOnly = true)
    public ElectionDetailResponse getElectionDetailForCurrentVoter(Long electionId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "認証情報が見つかりません。");
        }

        String email = auth.getName();

        VoterAccount account = voterAccountRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "アカウントが見つかりません。"));

        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "選挙が見つかりません。"));

        if (account.getCitizen().getDistrict() == null
                || election.getDistrict() == null
                || !election.getDistrict().getId().equals(account.getCitizen().getDistrict().getId())) {
            throw new ResponseStatusException(FORBIDDEN, "この選挙にはアクセスできません。");
        }

        return new ElectionDetailResponse(
                election.getId(),
                election.getCode(),
                election.getName(),
                election.getDescription(),
                election.getDistrict().getName(),
                election.getStatus(),
                election.getStartsAt(),
                election.getEndsAt()
        );
    }
}
