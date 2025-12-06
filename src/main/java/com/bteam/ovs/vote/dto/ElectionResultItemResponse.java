// src/main/java/com/bteam/ovs/vote/dto/ElectionResultItemResponse.java
package com.bteam.ovs.vote.dto;

public record ElectionResultItemResponse(
        Long candidateId,
        String candidateName,
        String partyName,
        long voteCount
) {
}
