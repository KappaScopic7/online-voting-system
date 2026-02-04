package com.bteam.ovs.demo.json;

import java.util.List;

public record PartyJson(String partyKey, String name, String shortName,
        List<String> ideologyTags, String description, String color) {
}