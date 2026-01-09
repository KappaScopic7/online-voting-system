package com.bteam.ovs.auth.repo;

import com.bteam.ovs.auth.model.StaffAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface StaffAccountRepository extends JpaRepository<StaffAccount, UUID> {
    Optional<StaffAccount> findByLoginId(String loginId);
    boolean existsByLoginId(String loginId);
}
