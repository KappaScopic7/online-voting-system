package com.bteam.ovs.auth.dto.response;

public record NfcLoginResponse(
        String ticket,
        long expiresInSec) {
}
