// backend/src/main/java/com/bteam/ovs/citizen/entity/Citizen.java
package com.bteam.ovs.citizen.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "citizen")
@EntityListeners(AuditingEntityListener.class)
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

    // ✅ 追加：NFC投票PIN（BCrypt hash）
    @Column(name = "nfc_pin_hash", nullable = false, length = 255)
    private String nfcPinHash;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // --- getters/setters ---
    public UUID getCitizenId() {
        return citizenId;
    }

    public void setCitizenId(UUID citizenId) {
        this.citizenId = citizenId;
    }

    public String getFamilyName() {
        return familyName;
    }

    public void setFamilyName(String familyName) {
        this.familyName = familyName;
    }

    public String getGivenName() {
        return givenName;
    }

    public void setGivenName(String givenName) {
        this.givenName = givenName;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public String getPrefCode() {
        return prefCode;
    }

    public void setPrefCode(String prefCode) {
        this.prefCode = prefCode;
    }

    public String getCityCode() {
        return cityCode;
    }

    public void setCityCode(String cityCode) {
        this.cityCode = cityCode;
    }

    public String getAddressLine() {
        return addressLine;
    }

    public void setAddressLine(String addressLine) {
        this.addressLine = addressLine;
    }

    public Gender getGender() {
        return gender;
    }

    public void setGender(Gender gender) {
        this.gender = gender;
    }

    public String getNfcPinHash() {
        return nfcPinHash;
    }

    public void setNfcPinHash(String nfcPinHash) {
        this.nfcPinHash = nfcPinHash;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
