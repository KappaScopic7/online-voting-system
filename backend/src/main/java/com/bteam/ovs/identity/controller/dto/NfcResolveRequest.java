package com.bteam.ovs.identity.controller.dto;

import jakarta.validation.constraints.NotBlank;

public record NfcResolveRequest(
        @NotBlank String payload) {
}
