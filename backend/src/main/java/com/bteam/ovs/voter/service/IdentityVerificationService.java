package com.bteam.ovs.voter.service;

import com.bteam.ovs.election.domain.Election;
import com.bteam.ovs.election.repository.ElectionRepository;
import com.bteam.ovs.voter.domain.NfcCredential;
import com.bteam.ovs.voter.domain.VoterAccount;
import com.bteam.ovs.voter.domain.VoterElectionIdentity;
import com.bteam.ovs.voter.dto.IdentityStatusResponse;
import com.bteam.ovs.voter.repository.NfcCredentialRepository;
import com.bteam.ovs.voter.repository.VoterAccountRepository;
import com.bteam.ovs.voter.repository.VoterElectionIdentityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

import static org.springframework.http.HttpStatus.*;

@Service
@RequiredArgsConstructor
public class IdentityVerificationService {

    private final VoterAccountRepository voterAccountRepository;
    private final ElectionRepository electionRepository;
    private final NfcCredentialRepository nfcCredentialRepository;
    private final VoterElectionIdentityRepository voterElectionIdentityRepository;
    private final PasswordEncoder passwordEncoder;

    private VoterAccount currentAccount() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) throw new ResponseStatusException(UNAUTHORIZED, "認証情報がありません。");

        return voterAccountRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "アカウントが見つかりません。"));
    }

    @Transactional
    public IdentityStatusResponse verify(Long electionId, String cardId, String pin) {
        if (electionId == null || cardId == null || pin == null) {
            throw new ResponseStatusException(BAD_REQUEST, "入力が不正です。");
        }

        VoterAccount account = currentAccount();

        Election election = electionRepository.findById(electionId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "選挙が見つかりません。"));

        // 投票権チェック（例：同じdistrict）
        if (account.getCitizen() == null || account.getCitizen().getDistrict() == null ||
            !account.getCitizen().getDistrict().getId().equals(election.getDistrict().getId())) {
            throw new ResponseStatusException(FORBIDDEN, "この選挙では投票できません。");
        }

        // 擬似NFC照合
        NfcCredential cred = nfcCredentialRepository.findByCardId(cardId)
            .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "カード情報が不正です。"));

        if (!cred.getVoterAccount().getId().equals(account.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "このカードはあなたのものではありません。");
        }

        if (!passwordEncoder.matches(pin, cred.getPinHash())) {
            throw new ResponseStatusException(UNAUTHORIZED, "暗証番号が不正です。");
        }

        // すでに認証済みならそのまま返す（冪等）
        var existing = voterElectionIdentityRepository.findByVoterAccountAndElection(account, election);
        if (existing.isPresent()) {
            return new IdentityStatusResponse(true, existing.get().getVerifiedAt());
        }

        LocalDateTime now = LocalDateTime.now();
        voterElectionIdentityRepository.save(
            VoterElectionIdentity.builder()
                .voterAccount(account)
                .election(election)
                .verifiedAt(now)
                .build()
        );

        return new IdentityStatusResponse(true, now);
    }

    @Transactional(readOnly = true)
    public IdentityStatusResponse status(Long electionId) {
        VoterAccount account = currentAccount();
        Election election = electionRepository.findById(electionId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "選挙が見つかりません。"));

        var opt = voterElectionIdentityRepository.findByVoterAccountAndElection(account, election);
        return opt.map(v -> new IdentityStatusResponse(true, v.getVerifiedAt()))
            .orElseGet(() -> new IdentityStatusResponse(false, null));
    }
}
