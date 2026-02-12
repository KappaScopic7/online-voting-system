// backend/src/main/java/com/bteam/ovs/citizen/entity/Citizen.java
package com.bteam.ovs.citizen.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "citizen")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class Citizen {

    @Id
    @Column(name = "citizen_id", nullable = false)
    private UUID citizenId;

    @Column(name = "family_name", nullable = false, length = 100)
    private String familyName;

    @Column(name = "given_name", nullable = false, length = 100)
    private String givenName;

    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    @Column(name = "pref_code", nullable = false, length = 10)
    private String prefCode;

    @Column(name = "city_code", nullable = false, length = 10)
    private String cityCode;

    @Column(name = "address_line", nullable = false, length = 200)
    private String addressLine;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false, length = 5)
    private Gender gender;

    @Column(name = "nfc_pin_hash", nullable = false, length = 255)
    private String nfcPinHash;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

}
