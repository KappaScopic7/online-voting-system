package com.bteam.ovs.voter.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.bteam.ovs.auth.domain.Role;
import com.bteam.ovs.auth.infra.security.JwtService;
import com.bteam.ovs.voter.domain.VoterAccount;
import com.bteam.ovs.voter.repository.NfcCredentialRepository;
import com.bteam.ovs.voter.repository.VoterAccountRepository;

@Service
public class VoterIdentityService {

    private final NfcCredentialRepository nfcCredentialRepository;
    private final VoterAccountRepository voterAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public VoterIdentityService(
        NfcCredentialRepository nfcCredentialRepository,
        VoterAccountRepository voterAccountRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService
    ) {
        this.nfcCredentialRepository = nfcCredentialRepository;
        this.voterAccountRepository = voterAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public String verifyAndIssueToken(String cardId, String pin) {
        var cred = nfcCredentialRepository.findByCardId(cardId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "カードが見つかりません"));

        if (!passwordEncoder.matches(pin, cred.getPinHash())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "PINが違います");
        }

        // voterId に紐づく VoterAccount を用意（無ければ作る）
        VoterAccount acc = voterAccountRepository.findByVoterId(cred.getVoterId())
            .orElseGet(() -> {
                var a = new VoterAccount();
                a.setVoterId(cred.getVoterId());
                return voterAccountRepository.save(a);
            });

        // subject は「principal=メール」の設計だけど、今はemail未導入なので仮のsubjectを使う
        // 例: "voter:<voterId>"（将来 portal/email を入れたら置換）
        String subject = "voter:" + cred.getVoterId();

        return jwtService.issueAccessToken(acc.getId(), subject, Role.VOTER);
    }
}
