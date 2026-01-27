// backend/src/main/java/com/bteam/ovs/elections/repository/PartyRepository.java
package com.bteam.ovs.elections.repository;

import com.bteam.ovs.elections.entity.Party;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PartyRepository extends JpaRepository<Party, UUID> {
    Optional<Party> findByPartyKey(String partyKey);

    boolean existsByPartyKey(String partyKey);

    List<Party> findByPartyKeyIn(Collection<String> partyKeys);
}
