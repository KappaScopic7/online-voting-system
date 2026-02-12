package com.bteam.ovs.identity.service;

import com.bteam.ovs.identity.entity.VotePairing;
import com.bteam.ovs.identity.repository.VotePairingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class VotePairingService {

    private final VotePairingRepository repo;

    // とりあえず 5分でOK（好みで調整）
    private static final Duration TTL = Duration.ofMinutes(5);

    public VotePairingService(VotePairingRepository repo) {
        this.repo = repo;
    }

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

        // 二重completeは上書きしない（安全側）
        if (p.getStatus() == VotePairing.Status.COMPLETED)
            return true;

        p.complete(ticket);
        return true;
    }
}
