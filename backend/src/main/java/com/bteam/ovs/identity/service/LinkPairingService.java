package com.bteam.ovs.identity.service;

import com.bteam.ovs.identity.entity.LinkPairing;
import com.bteam.ovs.identity.repository.LinkPairingRepository;

import lombok.AllArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@AllArgsConstructor
@Service
public class LinkPairingService {

    private final LinkPairingRepository repo;
    private final NfcResolveService nfcResolveService;
    private final IdentityLinkService identityLinkService;

    private static final Duration TTL = Duration.ofMinutes(5);

    @Transactional
    public LinkPairing create(UUID accountId) {
        Instant now = Instant.now();
        UUID pairId = UUID.randomUUID();
        LinkPairing p = new LinkPairing(pairId, accountId, now, now.plus(TTL));
        return repo.save(p);
    }

    @Transactional
    public LinkPairing getAndExpireIfNeeded(UUID pairId) {
        var p = repo.findById(pairId).orElse(null);
        if (p == null)
            return null;
        p.expireIfNeeded(Instant.now());
        return p;
    }

    /**
     * 成功: true（恒久リンク完了）
     * - 既にCOMPLETEDでも true（冪等）
     * - not found / expired は false
     */
    @Transactional
    public boolean completeWithNfc(UUID pairId, String payload, String pin) {
        LinkPairing p = repo.findById(pairId).orElse(null);
        if (p == null)
            return false;

        p.expireIfNeeded(Instant.now());
        if (p.getStatus() == LinkPairing.Status.EXPIRED)
            return false;

        if (p.getStatus() == LinkPairing.Status.COMPLETED)
            return true;

        // PIN+タッチ検証 → citizenId を得る
        var resolved = nfcResolveService.resolve(payload, pin);
        // ★ここだけ CitizenNfcResolveResponse のフィールド名に合わせる
        UUID citizenId = UUID.fromString(resolved.citizenId());

        // 恒久リンク（ログイン中accountIdに紐づけ）
        identityLinkService.link(p.getAccountId(), citizenId);

        p.complete();
        return true;
    }
}
