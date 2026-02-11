package com.bteam.ovs.auth.controller.dto;

import jakarta.validation.constraints.NotBlank;

public record NfcLinkExchangeRequest(
        @NotBlank String ticket) {
}
