package com.bteam.ovs.auth.dto.response;

public record NfcLinkLoginResponse(
        String ticket,
        long expiresInSec) {
}
