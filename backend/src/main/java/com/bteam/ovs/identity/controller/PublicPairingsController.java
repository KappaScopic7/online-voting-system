package com.bteam.ovs.identity.controller;

import com.bteam.ovs.identity.dto.response.VotePairingDtos;
import com.bteam.ovs.identity.entity.VotePairing;
import com.bteam.ovs.identity.service.VotePairingService;

import lombok.AllArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@AllArgsConstructor
@RestController
@RequestMapping("/api/public/pairings")
public class PublicPairingsController {

    private final VotePairingService service;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody VotePairingDtos.CreateRequest req) {
        if (req == null || req.electionId() == null) {
            return ResponseEntity.badRequest().body(new Msg("electionId is required"));
        }
        VotePairing p = service.create(req.electionId());
        return ResponseEntity.ok(new VotePairingDtos.CreateResponse(p.getPairId(), p.getExpiresAt()));
    }

    @GetMapping("/{pairId}")
    public ResponseEntity<?> get(@PathVariable("pairId") UUID pairId) {
        VotePairing p = service.getAndTouchExpire(pairId);
        if (p == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(VotePairingDtos.toGetResponse(p));
    }

    @PostMapping("/{pairId}/complete")
    public ResponseEntity<?> complete(
            @PathVariable("pairId") UUID pairId,
            @RequestBody VotePairingDtos.CompleteRequest req) {
        String payload = req == null ? null : req.payload();
        String pin = req == null ? null : req.pin();

        if (payload == null || payload.trim().isEmpty())
            return ResponseEntity.badRequest().body(new Msg("payload is required"));
        if (pin == null || pin.trim().isEmpty())
            return ResponseEntity.badRequest().body(new Msg("pin is required"));

        var ticket = service.completeWithNfc(pairId, payload.trim(), pin.trim());
        if (ticket == null)
            return ResponseEntity.notFound().build();

        return ResponseEntity.ok(new VotePairingDtos.CompleteResponse(ticket));
    }

    public record Msg(String message) {
    }
}
