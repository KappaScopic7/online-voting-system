package com.bteam.ovs.voter.service;

import com.bteam.ovs.election.domain.Election;
import com.bteam.ovs.election.repository.ElectionRepository;
import com.bteam.ovs.voter.domain.VoterAccount;
import com.bteam.ovs.voter.domain.VoterVerification;
import com.bteam.ovs.voter.repository.VoterVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

import static org.springframework.http.HttpStatus.*;

@Service
@RequiredArgsConstructor
public class VoterVerificationService {

    private final VoterVerificationRepository voterVerificationRepository;
    private final ElectionRepository electionRepository;
    private final com.bteam.ovs.voter.repository.VoterAccountRepository voterAccountRepository;

    private VoterAccount getCurrentVoter() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "認証情報が見つかりません。");
        }
        return voterAccountRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "アカウントが見つかりません。"));
    }

    @Transactional
    public void verifyForElection(Long electionId, String cardId, String pin) {
        VoterAccount voter = getCurrentVoter();
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "選挙が見つかりません。"));

        if (!"1234".equals(pin)) {
            throw new ResponseStatusException(BAD_REQUEST, "暗証番号が一致しません。");
        }

        String masked = mask(cardId);

        VoterVerification vv = voterVerificationRepository
                .findByVoterAccountAndElection(voter, election)
                .orElseGet(() -> VoterVerification.builder()
                        .voterAccount(voter)
                        .election(election)
                        .build());

        vv.setVerified(true);
        vv.setVerifiedAt(LocalDateTime.now());
        vv.setMethod("DEV_NFC");
        vv.setCardIdMasked(masked);

        voterVerificationRepository.save(vv);
    }

    @Transactional(readOnly = true)
    public boolean isVerified(Long electionId) {
        VoterAccount voter = getCurrentVoter();
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "選挙が見つかりません。"));
        return voterVerificationRepository.existsByVoterAccountAndElectionAndVerifiedTrue(voter, election);
    }

    private String mask(String raw) {
        if (raw == null) return null;
        if (raw.length() <= 4) return "****";
        return raw.substring(0, 2) + "****" + raw.substring(raw.length() - 2);
    }
}
