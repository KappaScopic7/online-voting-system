package com.bteam.ovs.announcement.repository;

import com.bteam.ovs.announcement.entity.SystemAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface SystemAnnouncementRepository extends JpaRepository<SystemAnnouncement, UUID> {
}
