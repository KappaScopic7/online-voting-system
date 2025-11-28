package com.bteam.ovs.voter.service;

import com.bteam.ovs.citizen.domain.Citizen;
import com.bteam.ovs.citizen.repository.CitizenRepository;
import com.bteam.ovs.voter.domain.VoterAccount;
import com.bteam.ovs.voter.domain.VoterStatus;
import com.bteam.ovs.voter.dto.VoterActivateRequest;
import com.bteam.ovs.voter.dto.VoterLoginRequest;
import com.bteam.ovs.voter.repository.VoterAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

import static org.springframework.http.HttpStatus.*;

@Service
@RequiredArgsConstructor
public class VoterAuthService {

    private final CitizenRepository citizenRepository;
    private final VoterAccountRepository voterAccountRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 疑似マイナンバーで本人特定し、メール＆パスワードを登録して ACTIVE にする。
     */
    @Transactional
    public void activate(VoterActivateRequest request) {
        Citizen citizen = citizenRepository.findByPseudoMyNumber(request.pseudoMyNumber())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "該当する市民情報が見つかりません。"));

        VoterAccount account = voterAccountRepository.findByCitizen(citizen)
                .orElseThrow(() -> new ResponseStatusException(INTERNAL_SERVER_ERROR, "VoterAccountが事前登録されていません。"));

        if (account.getEmail() != null) {
            throw new ResponseStatusException(BAD_REQUEST, "すでにログイン情報が登録されています。");
        }

        if (voterAccountRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(BAD_REQUEST, "このメールアドレスは既に使用されています。");
        }

        account.setEmail(request.email());
        account.setPasswordHash(passwordEncoder.encode(request.password()));
        account.setStatus(VoterStatus.ACTIVE);

        voterAccountRepository.save(account);
    }

    /**
     * メール＆パスワードでログイン。
     * ひとまず認証だけ行い、JWTなどは後で実装。
     */
    @Transactional
    public void login(VoterLoginRequest request) {
        VoterAccount account = voterAccountRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "メールアドレスまたはパスワードが不正です。"));

        if (account.getStatus() != VoterStatus.ACTIVE) {
            throw new ResponseStatusException(FORBIDDEN, "アカウントが有効化されていません。");
        }

        if (!passwordEncoder.matches(request.password(), account.getPasswordHash())) {
            throw new ResponseStatusException(UNAUTHORIZED, "メールアドレスまたはパスワードが不正です。");
        }

        account.setLastLoginAt(LocalDateTime.now());
        voterAccountRepository.save(account);

        // TODO: JWT 発行して返すのはあとで
    }
}
