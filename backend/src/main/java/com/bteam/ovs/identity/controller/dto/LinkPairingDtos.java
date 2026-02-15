package com.bteam.ovs.identity.controller.dto;

import com.bteam.ovs.identity.entity.LinkPairing;
import java.time.Instant;
import java.util.UUID;

public class LinkPairingDtos {

    public record CreateResponse(UUID pairId, Instant expiresAt) {
    }

    public record CompleteRequest(String payload, String pin) {
    }

    public record GetResponse(
            UUID pairId,
            UUID accountId,
            String status,
            Instant createdAt,
            Instant expiresAt) {
    }

    public static GetResponse toGetResponse(LinkPairing p) {
        return new GetResponse(
                p.getPairId(),
                p.getAccountId(),
                p.getStatus().name(),
                p.getCreatedAt(),
                p.getExpiresAt());
    }
}
