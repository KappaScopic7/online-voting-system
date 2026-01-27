// backend/src/main/java/com/bteam/ovs/elections/controller/dto/CandidateItem.java
package com.bteam.ovs.elections.controller.dto;

import java.util.UUID;

public record CandidateItem(
        UUID id,
        String candidateKey,
        String name,
        Integer age,
        String title,
        int sortOrder,
        PartyEmbed party) {
    public record PartyEmbed(
            String partyKey,
            String shortName,
            String name,
            String color) {
    }
}
