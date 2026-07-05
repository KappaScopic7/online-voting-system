// backend/src/main/java/com/bteam/ovs/elections/repository/PartyRepository.java
package com.bteam.ovs.parties.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.bteam.ovs.parties.entity.Party;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PartyRepository extends JpaRepository<Party, UUID> {
    Optional<Party> findByPartyKey(String partyKey);

    boolean existsByPartyKey(String partyKey);

    List<Party> findByPartyKeyIn(Collection<String> partyKeys);

    long countByIdIn(Collection<UUID> ids); // ★追加
}
