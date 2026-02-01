package com.bteam.ovs.elections.controller.dto;

import java.time.Instant;
import java.util.UUID;

public record MyElectionItem(
                UUID electionId,
                String title,
                Instant startsAt,
                Instant endsAt,
                String status,
                boolean hasResult,
                boolean canCast,
                CurrentVote currentVote) {
        public record CurrentVote(
                        UUID candidateId,
                        String candidateName,
                        Instant castedAt) {
        }
}
