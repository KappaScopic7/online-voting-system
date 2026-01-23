package com.bteam.ovs.auth.controller.dto;

public record TokenResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        String role
) {}
