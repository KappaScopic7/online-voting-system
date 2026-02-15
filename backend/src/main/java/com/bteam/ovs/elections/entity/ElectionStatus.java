// backend/src/main/java/com/bteam/ovs/elections/entity/ElectionStatus.java
package com.bteam.ovs.elections.entity;

public enum ElectionStatus {
    DRAFT,
    READY,
    OPEN,
    CLOSED,
    TALLYING,
    TALLIED,
    PUBLISHED,
    ARCHIVED
}
