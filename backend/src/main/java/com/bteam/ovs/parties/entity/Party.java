// backend/src/main/java/com/bteam/ovs/elections/entity/Party.java
package com.bteam.ovs.parties.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "party", uniqueConstraints = {
        @UniqueConstraint(name = "uq_party_party_key", columnNames = "party_key")
})
public class Party {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "party_key", nullable = false, length = 100)
    private String partyKey;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "short_name", nullable = false, length = 50)
    private String shortName;

    @Column(nullable = false, length = 20)
    private String color; // "#RRGGBB"

    @Column(nullable = false, length = 1000)
    private String description;

    @ElementCollection
    @CollectionTable(name = "party_ideology_tag", joinColumns = @JoinColumn(name = "party_id"))
    @Column(name = "tag", nullable = false, length = 100)
    private List<String> ideologyTags = new ArrayList<>();

    // getters/setters
    public UUID getId() {
        return id;
    }

    public String getPartyKey() {
        return partyKey;
    }

    public void setPartyKey(String partyKey) {
        this.partyKey = partyKey;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getShortName() {
        return shortName;
    }

    public void setShortName(String shortName) {
        this.shortName = shortName;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getIdeologyTags() {
        return ideologyTags;
    }

    public void setIdeologyTags(List<String> ideologyTags) {
        this.ideologyTags = ideologyTags;
    }
}
