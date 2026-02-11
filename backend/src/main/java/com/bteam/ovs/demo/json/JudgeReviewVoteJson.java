package com.bteam.ovs.demo.json;

import java.util.List;
import java.util.UUID;

public record JudgeReviewVoteJson(
        String electionKey,
        UUID citizenId,
        long castedAtOffsetSec,
        List<ItemJson> items) {
    public record ItemJson(int judgeIndex, String choice) {
    }
}
