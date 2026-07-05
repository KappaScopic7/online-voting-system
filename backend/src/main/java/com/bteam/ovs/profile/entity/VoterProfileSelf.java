package com.bteam.ovs.profile.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "voter_profile_self")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
public class VoterProfileSelf {

    @Id
    @Column(name = "account_id", columnDefinition = "uuid")
    private UUID accountId;

    // optional
    @Column(name = "birth_date", nullable = true)
    private LocalDate birthDate;

    // optional（住所ペア制約は service + DB CHECK）
    @Column(name = "pref_code", nullable = true, length = 10)
    private String prefCode;

    @Column(name = "city_code", nullable = true, length = 10)
    private String cityCode;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void requireAccountId() {
        if (accountId == null)
            throw new IllegalStateException("accountId is required");
    }
}
