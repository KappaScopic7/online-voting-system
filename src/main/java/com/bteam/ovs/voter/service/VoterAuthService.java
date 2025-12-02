package com.bteam.ovs.voter.service;

import com.bteam.ovs.citizen.domain.Citizen;
import com.bteam.ovs.citizen.repository.CitizenRepository;
import com.bteam.ovs.config.JwtProvider;
import com.bteam.ovs.voter.domain.VoterAccount;
import com.bteam.ovs.voter.domain.VoterStatus;
import com.bteam.ovs.voter.dto.VoterActivateRequest;
import com.bteam.ovs.voter.dto.VoterLoginRequest;
import com.bteam.ovs.voter.dto.VoterLoginResponse;
import com.bteam.ovs.voter.repository.VoterAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.bteam.ovs.voter.dto.VoterMeResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

import static org.springframework.http.HttpStatus.*;


@Service
@RequiredArgsConstructor
public class VoterAuthService {

    private final CitizenRepository citizenRepository;
    private final VoterAccountRepository voterAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

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

@Transactional
    public VoterLoginResponse login(VoterLoginRequest request) {
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

        String token = jwtProvider.generateToken(account);
        return new VoterLoginResponse(token);
    }

@Transactional(readOnly = true)
    public VoterMeResponse getMe() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "認証情報が見つかりません。");
        }

        String email = auth.getName();

        VoterAccount account = voterAccountRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "アカウントが見つかりません。"));

        var citizen = account.getCitizen();

        return new VoterMeResponse(
                account.getEmail(),
                account.getStatus(),
                citizen.getFamilyName(),
                citizen.getGivenName(),
                citizen.getPrefecture(),
                citizen.getCity(),
                citizen.getAddressLine()
        );
    }
}