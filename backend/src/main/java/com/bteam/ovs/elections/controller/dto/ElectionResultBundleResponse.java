package com.bteam.ovs.elections.controller.dto;

import java.util.UUID;

public record ElectionResultBundleResponse(
        UUID electionId,
        String ballotType,
        ElectionResultResponse normal,
        AllocElectionResultResponse alloc) {
}
