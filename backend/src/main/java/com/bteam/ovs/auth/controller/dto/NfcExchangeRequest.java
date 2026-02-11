package com.bteam.ovs.auth.controller.dto;

import jakarta.validation.constraints.NotBlank;

public record NfcExchangeRequest(
        @NotBlank String ticket) {
}
