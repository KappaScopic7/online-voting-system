// backend/src/main/java/com/bteam/ovs/master/service/MasterService.java
package com.bteam.ovs.master.service;

import com.bteam.ovs.master.controller.dto.CityItem;
import com.bteam.ovs.master.controller.dto.PrefItem;
import com.bteam.ovs.master.controller.dto.ZipAddressCandidate;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MasterService {

    private final ObjectMapper om;

    // 起動時ロード（卒制ならこれで十分）
    private final List<PrefItem> prefs;
    private final Map<String, List<CityItem>> citiesByPref; // prefCode -> cities
    private final Map<String, List<ZipAddressCandidate>> zipMap; // zip -> candidates

    public MasterService(ObjectMapper om) {
        this.om = om;
        this.prefs = load("prefs.json", new TypeReference<List<PrefItem>>() {
        });
        var allCities = load("cities.json", new TypeReference<List<CityRow>>() {
        });
        this.citiesByPref = allCities.stream()
                .collect(Collectors.groupingBy(
                        CityRow::prefCode,
                        Collectors.mapping(r -> new CityItem(r.cityCode(), r.cityName()), Collectors.toList())));
        var zipRows = load("zip.json", new TypeReference<List<ZipRow>>() {
        });
        this.zipMap = zipRows.stream()
                .collect(Collectors.groupingBy(
                        ZipRow::zip,
                        Collectors.mapping(r -> new ZipAddressCandidate(
                                r.prefCode(), r.prefName(), r.cityCode(), r.cityName(), r.town()),
                                Collectors.toList())));
    }

    public List<PrefItem> listPrefs() {
        return prefs;
    }

    public List<CityItem> listCities(String prefCode, String q) {
        var list = citiesByPref.getOrDefault(prefCode, List.of());
        if (q == null || q.isBlank()) {
            return limit(list, 200);
        }
        var s = q.trim();
        return limit(list.stream()
                .filter(c -> c.cityName().contains(s) || c.cityCode().contains(s))
                .toList(), 200);
    }

    public List<ZipAddressCandidate> lookupByZip(String zip) {
        return zipMap.getOrDefault(zip, List.of());
    }

    private <T> T load(String path, TypeReference<T> type) {
        try (InputStream is = new ClassPathResource(path).getInputStream()) {
            return om.readValue(is, type);
        } catch (Exception e) {
            throw new IllegalStateException("failed to load master data: " + path, e);
        }
    }

    private static <T> List<T> limit(List<T> list, int max) {
        if (list.size() <= max)
            return list;
        return list.subList(0, max);
    }

    // JSON row shapes
    private record CityRow(String prefCode, String cityCode, String cityName) {
    }

    private record ZipRow(String zip, String prefCode, String prefName, String cityCode, String cityName, String town) {
    }
}
