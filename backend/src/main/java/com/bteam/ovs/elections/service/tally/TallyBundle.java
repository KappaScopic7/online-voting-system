package com.bteam.ovs.elections.service.tally;

import java.time.Instant;
import java.util.List;

public record TallyBundle(
        String electionId,
        String title,
        String ballotType,
        Instant talliedAt,
        long total,
        Long noneSupportTotal,
        List<Row> rows) {
    public record Row(
            String targetType,
            String targetId,
            String key,
            String label,
            long value) {
    }
}
