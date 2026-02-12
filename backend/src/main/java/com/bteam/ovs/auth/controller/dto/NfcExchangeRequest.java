package com.bteam.ovs.auth.controller.dto;

import java.util.UUID;

public record NfcExchangeRequest(
        String ticket,
        UUID electionId) {
}
