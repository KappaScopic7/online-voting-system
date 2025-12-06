package com.bteam.ovs.election.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "candidate")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Candidate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "party_name", length = 100)
    private String partyName;

    @Column(name = "profile", length = 2000)
    private String profile;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @ManyToOne(optional = false)
    @JoinColumn(name = "election_id", nullable = false)
    private Election election;
}
