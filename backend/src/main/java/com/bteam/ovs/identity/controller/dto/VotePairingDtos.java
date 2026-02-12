package com.bteam.ovs.identity.controller.dto;

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
            String status,
            String ticket) {
    }

    public record CompleteRequest(String ticket) {
    }

    public static GetResponse toGetResponse(VotePairing p) {
        return new GetResponse(
                p.getPairId(),
                p.getStatus().name(),
                p.getTicket());
    }
}
