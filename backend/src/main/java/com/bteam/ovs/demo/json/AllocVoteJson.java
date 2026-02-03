package com.bteam.ovs.demo.json;

import java.util.List;
import java.util.UUID;

public record AllocVoteJson(
        String electionKey,
        UUID citizenId,
        long castedAtOffsetSec,
        List<AllocItemJson> items) {
    public record AllocItemJson(String type, Integer candidateIndex, Integer points) {
    }
}
