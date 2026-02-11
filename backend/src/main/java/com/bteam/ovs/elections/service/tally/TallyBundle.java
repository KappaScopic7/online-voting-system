package com.bteam.ovs.elections.service.tally;

import java.time.Instant;
import java.util.List;

public record TallyBundle(
        String electionId,
        String title,
        String ballotType,
        Instant talliedAt,
        long total,
        Long noneSupportTotal, // SINGLE_CHOICE: 票数 / ALLOCATION: ポイント
        List<Row> rows) {
    public record Row(
            String targetType, // "CANDIDATE" or "PARTY"
            String targetId,
            String key, // candidateKey / partyKey
            String label, // name
            long value // votes / points
    ) {
    }
}
