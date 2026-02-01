// backend/src/main/java/com/bteam/ovs/elections/controller/dto/PartyDetailResponse.java
package com.bteam.ovs.parties.controller.dto;

import java.util.List;

public record PartyDetailResponse(
        String partyKey,
        String name,
        String shortName,
        String color,
        String description,
        List<String> ideologyTags) {
}
