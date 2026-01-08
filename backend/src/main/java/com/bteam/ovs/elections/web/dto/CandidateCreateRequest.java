package com.bteam.ovs.elections.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CandidateCreateRequest(
        @NotBlank @Size(max = 120) String name
) {}
