package com.bteam.ovs.demo.json;

import java.util.UUID;

public record VoteJson(String electionKey, UUID citizenId, int candidateIndex, long castedAtOffsetSec) {
}