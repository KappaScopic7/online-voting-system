package com.bteam.ovs.voter.dto;

public record VerifyIdentityAndRegisterRequest(
    String cardId,
    String pin,
    String email,
    String password
) {}
