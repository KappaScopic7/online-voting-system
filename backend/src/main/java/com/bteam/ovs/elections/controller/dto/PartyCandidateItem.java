// backend/src/main/java/com/bteam/ovs/elections/controller/dto/PartyCandidateItem.java
package com.bteam.ovs.elections.controller.dto;

import java.util.UUID;

public record PartyCandidateItem(
        UUID candidateId,
        UUID electionId,
        String candidateKey,
        String name,
        Integer age,
        String title,
        String imageUrl) {
}
