package com.bteam.ovs.identity.controller;

import com.bteam.ovs.identity.dto.response.LinkPairingDtos;
import com.bteam.ovs.identity.service.LinkPairingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/public/link-pairings")
public class PublicLinkPairingsController {

    private final LinkPairingService service;

    public PublicLinkPairingsController(LinkPairingService service) {
        this.service = service;
    }

    @PostMapping("/{pairId}/complete")
    public ResponseEntity<?> complete(
            @PathVariable("pairId") UUID pairId,
            @RequestBody LinkPairingDtos.CompleteRequest req) {
        String payload = req == null ? null : req.payload();
        String pin = req == null ? null : req.pin();

        if (payload == null || payload.trim().isEmpty())
            return ResponseEntity.badRequest().body(new Msg("payload is required"));
        if (pin == null || pin.trim().isEmpty())
            return ResponseEntity.badRequest().body(new Msg("pin is required"));

        boolean ok = service.completeWithNfc(pairId, payload.trim(), pin.trim());
        if (!ok)
            return ResponseEntity.notFound().build(); // 期限切れを分けたければ 410 にしてもOK

        return ResponseEntity.ok().build();
    }

    public record Msg(String message) {
    }
}
