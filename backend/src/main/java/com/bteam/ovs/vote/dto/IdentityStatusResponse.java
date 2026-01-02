package com.bteam.ovs.vote.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public record IdentityStatusResponse(
        boolean verified,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime verifiedAt
) {}
