package com.bteam.ovs.auth.dto.response;

public record TokenResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        String role) {
}
