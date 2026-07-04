package com.bteam.ovs.auth.dto.request;

import java.util.UUID;

public record NfcExchangeRequest(
        String ticket,
        UUID electionId) {
}
