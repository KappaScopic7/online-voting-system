// backend/src/main/java/com/bteam/ovs/publicapi/identity/dto/NfcVerifyRequest.java
package com.bteam.ovs.publicapi.identity.dto;

import jakarta.validation.constraints.NotBlank;

public record NfcVerifyRequest(
                @NotBlank String uuid,
                @NotBlank String electionId) {
}
