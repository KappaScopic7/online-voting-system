package com.bteam.ovs.auth.service;

import com.bteam.ovs.auth.controller.dto.TokenResponse;
import com.bteam.ovs.auth.controller.dto.NfcLoginRequest;
import com.bteam.ovs.auth.controller.dto.NfcLoginResponse;
import com.bteam.ovs.auth.controller.dto.NfcExchangeRequest;
import com.bteam.ovs.config.security.JwtService;
import com.bteam.ovs.identity.service.NfcResolveService;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NfcAuthService {

    private static final long TICKET_TTL_SEC = 60;

    private record TicketData(UUID citizenId, UUID electionId, Instant expiresAt) {
    }

    // ticket -> data（本番はRedis推奨だが卒制ならOK）
    private final Map<String, TicketData> store = new ConcurrentHashMap<>();

    private final NfcResolveService nfcResolveService;
    private final JwtService jwtService;

    public NfcAuthService(NfcResolveService nfcResolveService, JwtService jwtService) {
        this.nfcResolveService = nfcResolveService;
        this.jwtService = jwtService;
    }

    public NfcLoginResponse login(NfcLoginRequest req) {
        // electionId
        final UUID electionId;
        try {
            electionId = UUID.fromString(req.electionId().trim());
        } catch (Exception e) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_ELECTION_ID",
                    "electionIdが不正です");
        }

        // ✅ ここが整合の本体（payload→citizenId抽出 + PIN(hash)照合）
        UUID citizenId = nfcResolveService.resolveCitizenId(req.payload(), req.pin());

        // ticket発行（ワンタイム・短命）
        String ticket = UUID.randomUUID().toString();
        Instant exp = Instant.now().plusSeconds(TICKET_TTL_SEC);

        store.put(ticket, new TicketData(citizenId, electionId, exp));

        return new NfcLoginResponse(ticket, TICKET_TTL_SEC);
    }

    public TokenResponse exchange(NfcExchangeRequest req) {
        String ticket = req.ticket().trim();

        // ワンタイム
        TicketData data = store.remove(ticket);
        if (data == null) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_TICKET",
                    "チケットが無効です");
        }

        if (data.expiresAt().isBefore(Instant.now())) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "TICKET_EXPIRED",
                    "チケットの有効期限が切れています");
        }

        // ✅ voteToken発行（public投票で使う）
        String voteToken = jwtService.issueVoteToken(data.citizenId(), data.electionId());

        // TokenResponseは既存互換
        return new TokenResponse(
                voteToken,
                "Bearer",
                5 * 60, // JwtService.issueVoteTokenの既定(5分)に合わせる
                null);
    }
}
