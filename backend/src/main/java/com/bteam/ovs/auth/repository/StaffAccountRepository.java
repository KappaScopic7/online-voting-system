package com.bteam.ovs.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bteam.ovs.auth.entity.StaffAccount;

import java.util.Optional;
import java.util.UUID;

public interface StaffAccountRepository extends JpaRepository<StaffAccount, UUID> {
    Optional<StaffAccount> findByLoginId(String loginId);
    boolean existsByLoginId(String loginId);
}
