package com.bteam.ovs.elections.controller.dto;

import java.util.UUID;

public record ElectionResultBundleResponse(
        UUID electionId,
        String ballotType, // "SINGLE_CHOICE" or "ALLOCATION"
        ElectionResultResponse normal,
        AllocElectionResultResponse alloc) {
}
