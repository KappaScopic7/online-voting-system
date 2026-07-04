package com.bteam.ovs.identity.dto.response;

import com.bteam.ovs.identity.entity.VotePairing;

import java.time.Instant;
import java.util.UUID;

public class VotePairingDtos {

    public record CreateRequest(UUID electionId) {
    }

    public record CreateResponse(UUID pairId, Instant expiresAt) {
    }

    public record GetResponse(
            UUID pairId,
            UUID electionId,
            String status,
            Instant createdAt,
            Instant expiresAt,
            String ticket) {
    }

    public record CompleteRequest(String payload, String pin) {
    }

    public record CompleteResponse(String ticket) {
    }

    public static GetResponse toGetResponse(VotePairing p) {
        return new GetResponse(
                p.getPairId(),
                p.getElectionId(),
                p.getStatus().name(),
                p.getCreatedAt(),
                p.getExpiresAt(),
                p.getTicket());
    }
}
