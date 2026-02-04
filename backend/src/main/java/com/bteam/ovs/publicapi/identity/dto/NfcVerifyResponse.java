// backend/src/main/java/com/bteam/ovs/publicapi/identity/dto/NfcVerifyResponse.java
package com.bteam.ovs.publicapi.identity.dto;

public record NfcVerifyResponse(
        String voteToken,
        String tokenType,
        long expiresInSeconds) {
}
