package com.bteam.ovs.elections.controller.dto;

import java.util.UUID;

public record CandidateItem(
        UUID id,
        String name
) {}
