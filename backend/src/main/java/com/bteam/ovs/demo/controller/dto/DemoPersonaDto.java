package com.bteam.ovs.demo.controller.dto;

public record DemoPersonaDto(
        String key,
        String label,
        String description,
        String email,
        String password,
        String citizenId) {
}
