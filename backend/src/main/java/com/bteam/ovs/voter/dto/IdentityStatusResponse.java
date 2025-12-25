package com.bteam.ovs.voter.dto;

import java.time.LocalDateTime;

public record IdentityStatusResponse(
    boolean verified,
    LocalDateTime verifiedAt
) {}
