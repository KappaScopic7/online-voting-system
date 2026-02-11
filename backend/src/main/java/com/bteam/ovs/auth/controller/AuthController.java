// backend/src/main/java/com/bteam/ovs/auth/controller/AuthController.java
package com.bteam.ovs.auth.controller;

import com.bteam.ovs.auth.controller.dto.TokenResponse;
import com.bteam.ovs.config.security.JwtService;
import com.bteam.ovs.identity.service.NfcResolveService;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final NfcResolveService nfcResolveService;
    private final JwtService jwtService;

    public AuthController(NfcResolveService nfcResolveService, JwtService jwtService) {
        this.nfcResolveService = nfcResolveService;
        this.jwtService = jwtService;
    }

    // ★ electionId をやめる
    private record TicketData(UUID citizenId, Instant expiresAt) {
    }

    private static final Map<String, TicketData> ticketStore = new ConcurrentHashMap<>();

    public static class NfcLoginRequest {
        public String payload;
        public String pin;
        // public String electionId; // ★不要（残すなら optional 扱いに）
    }

    public static class ExchangeRequest {
        public String ticket;
    }

    @PostMapping("/nfc-login")
    public Map<String, String> nfcLogin(@RequestBody NfcLoginRequest request) {

        if (request == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "request is null");
        }

        // ✅ ここが整合の本体（payload→citizenId + PIN照合）
        UUID citizenId = nfcResolveService.resolveCitizenId(request.payload, request.pin);

        String ticket = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plusSeconds(60);

        ticketStore.put(ticket, new TicketData(citizenId, expiresAt));

        return Map.of("ticket", ticket, "expiresInSec", "60");
    }

    @PostMapping("/nfc/exchange")
    public TokenResponse exchange(@RequestBody ExchangeRequest req) {
        if (req == null || req.ticket == null || req.ticket.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TICKET", "ticket is required");
        }

        TicketData data = ticketStore.remove(req.ticket.trim()); // ワンタイム
        if (data == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_TICKET", "ticket is invalid");
        }

        if (data.expiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "TICKET_EXPIRED", "ticket expired");
        }

        // ✅ PUBLIC セッショントークン（選挙縛り無し）
        String publicToken = jwtService.issuePublicSessionToken(data.citizenId());

        return new TokenResponse(
                publicToken,
                "Bearer",
                30 * 60, // ← JwtService の TTL と合わせるのが理想（後述）
                null);
    }

}