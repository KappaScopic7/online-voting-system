package com.bteam.ovs.voter.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VoterActivateRequest(
        @NotBlank String pseudoMyNumber,
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8, max = 64) String password
) {
}
