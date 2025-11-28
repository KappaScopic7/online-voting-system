package com.bteam.ovs.voter.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record VoterLoginRequest(
        @Email @NotBlank String email,
        @NotBlank String password
) {
}
