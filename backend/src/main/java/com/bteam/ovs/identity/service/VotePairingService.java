package com.bteam.ovs.identity.service;

import com.bteam.ovs.identity.entity.VotePairing;
import com.bteam.ovs.identity.repository.VotePairingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
public class VotePairingService {

    private final VotePairingRepository repo;
    private final NfcResolveService nfcResolveService;

    private static final Duration TTL = Duration.ofMinutes(5);

    // 推測されにくい ticket（URL-safe）
    private static final SecureRandom RNG = new SecureRandom();
    private static final int TICKET_BYTES = 32;

    public VotePairingService(VotePairingRepository repo, NfcResolveService nfcResolveService) {
        this.repo = repo;
        this.nfcResolveService = nfcResolveService;
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

    // 既存：ticket を外から渡す版（残してもOK）
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
            return p.getTicket(); // or return null; じゃなくこれが正解
        }

        nfcResolveService.resolve(payload, pin);

        String ticket = generateTicket();
        p.complete(ticket);
        return ticket;

    }

    private String generateTicket() {
        byte[] b = new byte[TICKET_BYTES];
        RNG.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

}
