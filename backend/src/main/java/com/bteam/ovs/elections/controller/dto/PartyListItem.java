// backend/src/main/java/com/bteam/ovs/elections/controller/dto/PartyListItem.java
package com.bteam.ovs.elections.controller.dto;

public record PartyListItem(
        String partyKey,
        String name,
        String shortName,
        String color) {
}
