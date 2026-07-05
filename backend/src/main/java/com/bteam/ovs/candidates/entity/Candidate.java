// backend/src/main/java/com/bteam/ovs/elections/entity/Candidate.java
package com.bteam.ovs.candidates.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "candidate", uniqueConstraints = {
        @UniqueConstraint(name = "uq_candidate_election_candidate_key", columnNames = { "election_id",
                "candidate_key" })
})
@Getter
@Setter
public class Candidate {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "election_id", nullable = false)
    private UUID electionId;

    @Column(name = "candidate_key", nullable = false, length = 120)
    private String candidateKey;

    @Column(nullable = false, length = 200)
    private String name;

    @Column
    private Integer age;

    @Column(name = "party_key", length = 100)
    private String partyKey;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, length = 2000)
    private String bio;

    @ElementCollection
    @CollectionTable(name = "candidate_policy", joinColumns = @JoinColumn(name = "candidate_id"))
    @Column(name = "policy", nullable = false, length = 300)
    private List<String> policies = new ArrayList<>();

    @Column(name = "website_url", length = 500)
    private String websiteUrl;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

}
