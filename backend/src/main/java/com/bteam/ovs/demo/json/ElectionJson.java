package com.bteam.ovs.demo.json;

import java.util.List;

public record ElectionJson(
        String electionKey,
        String title,
        String summary,
        String electionType,
        DistrictJson district,
        String ballotType,
        long startsAtOffsetSec,
        long endsAtOffsetSec,
        List<String> candidates) {
    public record DistrictJson(String prefCode, String cityCode, String label) {
    }

}
