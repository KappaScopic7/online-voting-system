package com.bteam.ovs.demo.json;

import java.util.List;

public record CandidateJson(String candidateKey, String name, Integer age, String partyKey,
        String title, String bio, List<String> policies,
        String websiteUrl, String imageUrl) {
}