package com.bteam.ovs.auth.controller.dto;

public record NfcLoginResponse(
        String ticket,
        long expiresInSec) {
}
