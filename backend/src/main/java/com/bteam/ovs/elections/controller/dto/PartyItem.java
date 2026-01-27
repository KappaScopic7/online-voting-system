// backend/src/main/java/com/bteam/ovs/elections/controller/dto/PartyItem.java
package com.bteam.ovs.elections.controller.dto;

public record PartyItem(
        String partyKey,
        String shortName,
        String name,
        String color) {
}
