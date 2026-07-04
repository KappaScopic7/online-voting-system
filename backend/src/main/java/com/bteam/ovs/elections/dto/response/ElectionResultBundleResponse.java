package com.bteam.ovs.elections.dto.response;

import java.util.UUID;

public record ElectionResultBundleResponse(
        UUID electionId,
        String ballotType,
        ElectionResultResponse normal,
        AllocElectionResultResponse alloc) {
}
