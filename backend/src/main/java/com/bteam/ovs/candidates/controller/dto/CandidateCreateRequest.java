package com.bteam.ovs.candidates.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CandidateCreateRequest(
        @NotBlank @Size(max = 120) String name) {
}
