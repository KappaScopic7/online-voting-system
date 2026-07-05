package com.bteam.ovs.identity.service;

import com.bteam.ovs.auth.service.NfcAuthService; // ★追加
import com.bteam.ovs.identity.entity.VotePairing;
import com.bteam.ovs.identity.repository.VotePairingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VotePairingService {

    private final VotePairingRepository repo;
    private final NfcResolveService nfcResolveService;
    private final NfcAuthService nfcAuthService;

    private static final Duration TTL = Duration.ofMinutes(5);

    // 推測されにくい ticket（URL-safe）
    private static final SecureRandom RNG = new SecureRandom();
    private static final int TICKET_BYTES = 32;

    @Transactional
    public VotePairing create(UUID electionId) {
        Instant now = Instant.now();
        UUID pairId = UUID.randomUUID();
        VotePairing p = new VotePairing(pairId, electionId, now, now.plus(TTL));
        return repo.save(p);
    }

    @Transactional(readOnly = true)
    public VotePairing get(UUID pairId) {
        return repo.findById(pairId).orElse(null);
    }

    @Transactional
    public VotePairing getAndTouchExpire(UUID pairId) {
        VotePairing p = repo.findById(pairId).orElse(null);
        if (p == null)
            return null;
        p.expireIfNeeded(Instant.now());
        return p;
    }

    @Transactional
    public boolean complete(UUID pairId, String ticket) {
        VotePairing p = repo.findById(pairId).orElse(null);
        if (p == null)
            return false;

        p.expireIfNeeded(Instant.now());
        if (p.getStatus() == VotePairing.Status.EXPIRED)
            return false;

        if (p.getStatus() == VotePairing.Status.COMPLETED)
            return true;

        p.complete(ticket);
        return true;
    }

    @Transactional
    public String completeWithNfc(UUID pairId, String payload, String pin) {
        VotePairing p = repo.findById(pairId).orElse(null);
        if (p == null)
            return null;

        p.expireIfNeeded(Instant.now());
        if (p.getStatus() == VotePairing.Status.EXPIRED)
            return null;

        if (p.getStatus() == VotePairing.Status.COMPLETED) {
            return p.getTicket();
        }

        // 1. 本人確認（Resolve）して CitizenID を取得
        // ★修正: 戻り値を受け取るように変更
        var resolveRes = nfcResolveService.resolve(payload, pin);
        UUID citizenId = UUID.fromString(resolveRes.citizenId());

        // 2. チケット生成
        String ticket = generateTicket();

        // 3. DBに保存
        p.complete(ticket);

        // 4. ★ここが最重要！ 金庫番（NfcAuthService）にもチケットを預ける
        // これがないと exchange で見つからない
        nfcAuthService.registerTicket(ticket, citizenId);

        return ticket;
    }

    private String generateTicket() {
        byte[] b = new byte[TICKET_BYTES];
        RNG.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }
}