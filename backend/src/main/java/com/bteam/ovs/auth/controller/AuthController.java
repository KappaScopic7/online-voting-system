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

    private record TicketData(UUID citizenId, UUID electionId, Instant expiresAt) {
    }

    // Key: ticket, Value: citizenId + electionId + expires
    private static final Map<String, TicketData> ticketStore = new ConcurrentHashMap<>();

    public static class NfcLoginRequest {
        public String payload; // NFC NDEF文字列（UUID単体でもOK）
        public String pin; // 4桁
        public String electionId; // どの投票へ進むか（UUID）
    }

    public static class ExchangeRequest {
        public String ticket;
    }

    /**
     * Android → ticket発行
     * POST /api/auth/nfc-login
     */
    @PostMapping("/nfc-login")
    public Map<String, String> nfcLogin(@RequestBody NfcLoginRequest request) {

        if (request == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "request is null");
        }
        if (request.electionId == null || request.electionId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ELECTION_ID", "electionId is required");
        }

        final UUID electionId;
        try {
            electionId = UUID.fromString(request.electionId.trim());
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ELECTION_ID", "electionId is invalid UUID");
        }

        // ✅ ここが整合の本体（payload→citizenId + PIN照合）
        UUID citizenId = nfcResolveService.resolveCitizenId(request.payload, request.pin);

        // ticket発行（短命）
        String ticket = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plusSeconds(60);

        ticketStore.put(ticket, new TicketData(citizenId, electionId, expiresAt));

        return Map.of("ticket", ticket, "expiresInSec", "60");
    }

    /**
     * Web → ticketを voteToken に交換
     * POST /api/auth/nfc/exchange
     */
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

        // ✅ 既存のVOTEトークンを発行（public votingに使える）
        String voteToken = jwtService.issueVoteToken(data.citizenId(), data.electionId());

        return new TokenResponse(
                voteToken,
                "Bearer",
                5 * 60, // voteToken TTLは JwtService側が5分なので合わせる（厳密にしたいなら JwtServiceから取る）
                null);
    }
}
