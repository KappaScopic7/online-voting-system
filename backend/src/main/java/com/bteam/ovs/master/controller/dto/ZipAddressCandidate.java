// backend/src/main/java/com/bteam/ovs/master/controller/dto/ZipAddressCandidate.java
package com.bteam.ovs.master.controller.dto;

public record ZipAddressCandidate(
        String prefCode,
        String prefName,
        String cityCode,
        String cityName,
        String town) {
}
