package com.bteam.ovs.voter.dto;

public record VoterLoginResponse(
        String accessToken,
        String tokenType
) {
    public VoterLoginResponse(String accessToken) {
        this(accessToken, "Bearer");
    }
}
