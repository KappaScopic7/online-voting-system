package com.bteam.ovs.identity.controller;

import com.bteam.ovs.identity.controller.dto.VotePairingDtos;
import com.bteam.ovs.identity.entity.VotePairing;
import com.bteam.ovs.identity.service.VotePairingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/public/pairings")
public class PublicPairingsController {

    private final VotePairingService service;

    public PublicPairingsController(VotePairingService service) {
        this.service = service;
    }

    // PC: pairId 発行
    @PostMapping
    public ResponseEntity<?> create(@RequestBody VotePairingDtos.CreateRequest req) {
        if (req == null || req.electionId() == null) {
            return ResponseEntity.badRequest().body(new Msg("electionId is required"));
        }
        VotePairing p = service.create(req.electionId());
        return ResponseEntity.ok(new VotePairingDtos.CreateResponse(p.getPairId(), p.getExpiresAt()));
    }

    // PC: poll
    @GetMapping("/{pairId}")
    public ResponseEntity<?> get(@PathVariable UUID pairId) {
        VotePairing p = service.getAndTouchExpire(pairId);
        if (p == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(VotePairingDtos.toGetResponse(p));
    }

    // Android App: ticket 登録（Flutterが叩く）
    @PostMapping("/{pairId}/complete")
    public ResponseEntity<?> complete(
            @PathVariable UUID pairId,
            @RequestBody VotePairingDtos.CompleteRequest req) {
        String ticket = req == null ? null : req.ticket();
        if (ticket == null || ticket.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new Msg("ticket is required"));
        }
        boolean ok = service.complete(pairId, ticket.trim());
        if (!ok)
            return ResponseEntity.notFound().build(); // or 409/410でもOK。今は簡単に。
        return ResponseEntity.ok(new Msg("ok"));
    }

    public record Msg(String message) {
    }
}
