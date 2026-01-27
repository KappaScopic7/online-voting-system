// backend/src/main/java/com/bteam/ovs/elections/entity/Candidate.java
package com.bteam.ovs.elections.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity @Table(name = "candidate", uniqueConstraints = {
        @UniqueConstraint(name = "uq_candidate_election_candidate_key", columnNames = { "election_id",
                "candidate_key" })
})
public class Candidate {
    @Id @GeneratedValue
    private UUID id;

    @Column(name = "election_id", nullable = false)
    private UUID electionId;

    @Column(name = "candidate_key", nullable = false, length = 120)
    private String candidateKey;

    @Column(nullable = false, length = 200)
    private String name;

    @Column
    private Integer age; // null可（デモ候補）

    @Column(name = "party_key", length = 100)
    private String partyKey; // null可（無所属）

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, length = 2000)
    private String bio;

    @ElementCollection @CollectionTable(name = "candidate_policy", joinColumns = @JoinColumn(name = "candidate_id")) @Column(name = "policy", nullable = false, length = 300)
    private List<String> policies = new ArrayList<>();

    @Column(name = "website_url", length = 500)
    private String websiteUrl;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    // getters/setters
    public UUID getId() {
        return id;
    }

    public UUID getElectionId() {
        return electionId;
    }

    public void setElectionId(UUID electionId) {
        this.electionId = electionId;
    }

    public String getCandidateKey() {
        return candidateKey;
    }

    public void setCandidateKey(String candidateKey) {
        this.candidateKey = candidateKey;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getPartyKey() {
        return partyKey;
    }

    public void setPartyKey(String partyKey) {
        this.partyKey = partyKey;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public List<String> getPolicies() {
        return policies;
    }

    public void setPolicies(List<String> policies) {
        this.policies = policies;
    }

    public String getWebsiteUrl() {
        return websiteUrl;
    }

    public void setWebsiteUrl(String websiteUrl) {
        this.websiteUrl = websiteUrl;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }
}
