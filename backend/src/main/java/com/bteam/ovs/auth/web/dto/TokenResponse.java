package com.bteam.ovs.auth.web.dto;

public record TokenResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        String role
) {}
