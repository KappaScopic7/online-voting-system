package com.bteam.ovs.portal.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.bteam.ovs.auth.domain.Role;
import com.bteam.ovs.auth.infra.security.JwtService;
import com.bteam.ovs.portal.domain.PortalAccountStatus;
import com.bteam.ovs.portal.repository.PortalAccountRepository;
import com.bteam.ovs.voter.repository.NfcCredentialRepository;

@Service
public class IdentityLinkService {

    private final PortalAccountRepository portalAccountRepository;
    private final NfcCredentialRepository nfcCredentialRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public IdentityLinkService(
        PortalAccountRepository portalAccountRepository,
        NfcCredentialRepository nfcCredentialRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService
    ) {
        this.portalAccountRepository = portalAccountRepository;
        this.nfcCredentialRepository = nfcCredentialRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public String linkAndIssueVoterToken(String email, String cardId, String pin) {
        var account = portalAccountRepository.findByEmail(email.toLowerCase())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        // メール認証済みでないなら投票権に紐付け不可
        if (account.getStatus() != PortalAccountStatus.ACTIVE || account.getEmailVerifiedAt() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "メール認証が必要です");
        }

        if (account.getLinkedVoterId() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "既に本人認証済みです");
        }

        var cred = nfcCredentialRepository.findByCardId(cardId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "カードが見つかりません"));

        // NfcCredential#getPinHash() に合わせて
        if (!passwordEncoder.matches(pin, cred.getPinHash())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "PINが違います");
        }

        // NfcCredential#getVoterId() に合わせて
        account.setLinkedVoterId(cred.getVoterId());

        try {
            portalAccountRepository.save(account);
        } catch (DataIntegrityViolationException e) {
            // UNIQUE(linked_voter_id) で他アカ紐付けを検出
            throw new ResponseStatusException(HttpStatus.CONFLICT, "このカードは既に別アカウントに紐付いています");
        }

        // 単一roleのJWTなので、ここで VOTER JWT を返す（以降 /api/voter/** が叩ける）
        return jwtService.issueAccessToken(account.getId(), account.getEmail(), Role.VOTER);
    }
}
