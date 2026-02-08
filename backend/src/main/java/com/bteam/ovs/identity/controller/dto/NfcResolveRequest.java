// backend/src/main/java/com/bteam/ovs/identity/controller/dto/NfcResolveRequest.java
package com.bteam.ovs.identity.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record NfcResolveRequest(
        @NotBlank String payload,
        @NotBlank @Pattern(regexp = "^\\d{4}$", message = "pinは4桁の数字である必要があります") String pin) {
}
