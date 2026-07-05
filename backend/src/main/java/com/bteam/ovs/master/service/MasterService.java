package com.bteam.ovs.master.service;

import com.bteam.ovs.master.dto.response.CityItem;
import com.bteam.ovs.master.dto.response.PrefItem;
import com.bteam.ovs.master.dto.response.ZipAddressCandidate;
import com.bteam.ovs.master.seed.MachidaMasterSeed;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@Service
public class MasterService {

    // 起動時にJava Seedで固定ロード
    private final List<PrefItem> prefs;
    private final Map<String, List<CityItem>> citiesByPref; // prefCode -> cities
    private final Map<String, List<ZipAddressCandidate>> zipMap; // zip -> candidates

    public MasterService() {
        var seed = new MachidaMasterSeed();
        this.prefs = seed.prefs();
        this.citiesByPref = seed.citiesByPref();
        this.zipMap = seed.zipMap();
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
        if (zip == null)
            return List.of();
        // ハイフン入力対策
        var z = zip.replace("-", "").trim();
        return zipMap.getOrDefault(z, List.of());
    }

    private static <T> List<T> limit(List<T> list, int max) {
        if (list.size() <= max)
            return list;
        return list.subList(0, max);
    }
}
