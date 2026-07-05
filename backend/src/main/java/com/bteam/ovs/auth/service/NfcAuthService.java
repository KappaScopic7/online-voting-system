package com.bteam.ovs.auth.service;

import com.bteam.ovs.auth.dto.request.NfcExchangeRequest;
import com.bteam.ovs.auth.dto.request.NfcLinkExchangeRequest;
import com.bteam.ovs.auth.dto.request.NfcLinkLoginRequest;
import com.bteam.ovs.auth.dto.request.NfcLoginRequest;
import com.bteam.ovs.auth.dto.response.NfcLinkExchangeResponse;
import com.bteam.ovs.auth.dto.response.NfcLinkLoginResponse;
import com.bteam.ovs.auth.dto.response.NfcLoginResponse;
import com.bteam.ovs.auth.dto.response.TokenResponse;
import com.bteam.ovs.config.security.JwtService;
import com.bteam.ovs.identity.service.NfcResolveService;
import com.bteam.ovs.shared.errors.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RequiredArgsConstructor
@Service
public class NfcAuthService {

    private static final long TICKET_TTL_SEC = 60;

    private record VoteTicketData(UUID citizenId, Instant expiresAt) {
    }

    private final Map<String, VoteTicketData> voteStore = new ConcurrentHashMap<>();

    private record LinkTicketData(UUID citizenId, Instant expiresAt) {
    }

    private final Map<String, LinkTicketData> linkStore = new ConcurrentHashMap<>();

    private final NfcResolveService nfcResolveService;
    private final JwtService jwtService;

    public NfcLoginResponse login(NfcLoginRequest req) {
        try {
            UUID.fromString(req.electionId().trim());
        } catch (Exception e) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_ELECTION_ID",
                    "electionIdが不正です");
        }

        UUID citizenId = nfcResolveService.resolveCitizenId(req.payload(), req.pin());

        String ticket = UUID.randomUUID().toString();
        Instant exp = Instant.now().plusSeconds(TICKET_TTL_SEC);
        voteStore.put(ticket, new VoteTicketData(citizenId, exp));

        System.out.println("===[DEBUG: LOGIN SUCCESS]===");
        System.out.println("発行したチケット: [" + ticket + "]");

        return new NfcLoginResponse(ticket, TICKET_TTL_SEC);
    }

    public TokenResponse exchange(NfcExchangeRequest req) {
        String ticket = req.ticket().trim();

        VoteTicketData data = voteStore.get(ticket);

        if (data == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_TICKET", "チケットが無効です");
        }

        if (data.expiresAt().isBefore(Instant.now())) {
            voteStore.remove(ticket); // 期限切れの時だけ消す
            throw new ApiException(HttpStatus.UNAUTHORIZED, "TICKET_EXPIRED", "チケットの有効期限が切れています");
        }

        String publicToken = jwtService.issuePublicSessionToken(data.citizenId());

        voteStore.remove(ticket);

        return new TokenResponse(
                publicToken,
                "Bearer",
                (int) (30 * 60),
                null);
    }

    public NfcLinkLoginResponse linkLogin(NfcLinkLoginRequest req) {
        UUID citizenId = nfcResolveService.resolveCitizenId(req.payload(), req.pin());

        String ticket = UUID.randomUUID().toString();
        Instant exp = Instant.now().plusSeconds(TICKET_TTL_SEC);
        linkStore.put(ticket, new LinkTicketData(citizenId, exp));

        return new NfcLinkLoginResponse(ticket, TICKET_TTL_SEC);
    }

    public NfcLinkExchangeResponse linkExchange(NfcLinkExchangeRequest req) {
        String ticket = req.ticket().trim();

        LinkTicketData data = linkStore.remove(ticket);
        if (data == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_TICKET", "チケットが無効です");
        }
        if (data.expiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "TICKET_EXPIRED", "チケットの有効期限が切れています");
        }

        return new NfcLinkExchangeResponse(data.citizenId().toString());
    }

    public void registerTicket(String ticket, UUID citizenId) {
        Instant exp = Instant.now().plusSeconds(TICKET_TTL_SEC);
        voteStore.put(ticket, new VoteTicketData(citizenId, exp));
    }
}