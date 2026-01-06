package com.bteam.ovs.auth.api.dto;

public record TokenResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        String role
) {}
