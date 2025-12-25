package com.bteam.ovs.voter.dto;

import lombok.Data;

@Data
public class IdentityVerifyRequest {
    private Long electionId;
    private String cardId;
    private String pin;
}
