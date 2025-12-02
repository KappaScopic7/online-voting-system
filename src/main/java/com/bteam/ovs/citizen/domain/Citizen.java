package com.bteam.ovs.citizen.domain;

import com.bteam.ovs.election.domain.District;
import com.bteam.ovs.voter.domain.VoterAccount;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "citizen")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Citizen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pseudo_my_number", nullable = false, unique = true, length = 32)
    private String pseudoMyNumber;

    @Column(name = "family_name", nullable = false, length = 50)
    private String familyName;

    @Column(name = "given_name", nullable = false, length = 50)
    private String givenName;

    @Column(name = "prefecture", nullable = false, length = 50)
    private String prefecture;

    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "address_line", nullable = false, length = 255)
    private String addressLine;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    /**
     * 所属選挙区
     */
    @ManyToOne
    @JoinColumn(name = "district_id")
    private District district;

    @OneToOne(mappedBy = "citizen")
    private VoterAccount voterAccount;
}
