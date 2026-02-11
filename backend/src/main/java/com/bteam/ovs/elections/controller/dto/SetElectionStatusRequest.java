// backend/src/main/java/com/bteam/ovs/elections/controller/dto/SetElectionStatusRequest.java
package com.bteam.ovs.elections.controller.dto;

import com.bteam.ovs.elections.entity.ElectionStatus;

public record SetElectionStatusRequest(ElectionStatus status) {
}
