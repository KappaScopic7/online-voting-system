package com.bteam.ovs.auth.repo;

import com.bteam.ovs.auth.model.CommitteeAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CommitteeAccountRepository extends JpaRepository<CommitteeAccount, UUID> {
    Optional<CommitteeAccount> findByLoginId(String loginId);
    boolean existsByLoginId(String loginId);
}
