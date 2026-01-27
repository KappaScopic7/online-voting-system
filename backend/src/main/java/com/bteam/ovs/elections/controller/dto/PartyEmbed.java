// backend/src/main/java/com/bteam/ovs/elections/controller/dto/PartyEmbed.java
package com.bteam.ovs.elections.controller.dto;

import java.util.List;

public record PartyEmbed(
        String partyKey,
        String name,
        String shortName,
        String description,
        List<String> ideologyTags,
        String color) {
}
