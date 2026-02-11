package com.bteam.ovs.auth.controller.dto;

public record NfcLinkLoginResponse(
        String ticket,
        long expiresInSec) {
}
