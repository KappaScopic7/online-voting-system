package com.bteam.ovs.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.bteam.ovs.auth.entity.UserAccount;
import java.util.Optional;
import java.util.UUID;

public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {
    Optional<UserAccount> findByEmail(String email);

    boolean existsByEmail(String email);
}
