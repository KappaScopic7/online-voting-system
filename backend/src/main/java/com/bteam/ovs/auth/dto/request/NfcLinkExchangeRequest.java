package com.bteam.ovs.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record NfcLinkExchangeRequest(
        @NotBlank String ticket) {
}
