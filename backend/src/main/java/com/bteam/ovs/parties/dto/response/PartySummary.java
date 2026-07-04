// backend/src/main/java/com/bteam/ovs/elections/controller/dto/PartySummary.java
package com.bteam.ovs.parties.dto.response;

public record PartySummary(
        String partyKey,
        String name,
        String shortName,
        String color) {
}
