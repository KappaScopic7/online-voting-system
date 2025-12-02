package com.bteam.ovs.election.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "district")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class District {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 内部コード（例: TOKYO-MACHIDA-01）
     */
    @Column(name = "code", nullable = false, unique = true, length = 100)
    private String code;

    /**
     * 表示名（例: 東京都町田市第1区）
     */
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "prefecture", nullable = false, length = 50)
    private String prefecture;

    @Column(name = "city", nullable = false, length = 100)
    private String city;
}
