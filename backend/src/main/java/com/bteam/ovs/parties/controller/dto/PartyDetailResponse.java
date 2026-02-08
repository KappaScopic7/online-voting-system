package com.bteam.ovs.parties.controller.dto;

import java.util.List;
import java.util.UUID;

public record PartyDetailResponse(
        UUID id,
        String partyKey,
        String name,
        String shortName,
        String color,
        String description,
        List<String> ideologyTags) {
}
