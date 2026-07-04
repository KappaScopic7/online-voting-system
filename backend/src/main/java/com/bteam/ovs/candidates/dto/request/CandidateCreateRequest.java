package com.bteam.ovs.candidates.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CandidateCreateRequest(
        @NotBlank @Size(max = 120) String name) {
}
