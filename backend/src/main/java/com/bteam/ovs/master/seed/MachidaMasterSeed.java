package com.bteam.ovs.master.seed;

import com.bteam.ovs.master.controller.dto.CityItem;
import com.bteam.ovs.master.controller.dto.PrefItem;
import com.bteam.ovs.master.controller.dto.ZipAddressCandidate;

import java.util.List;
import java.util.Map;

public class MachidaMasterSeed {

    // 東京都だけ（必要なら神奈川も足せる）
    public List<PrefItem> prefs() {
        return List.of(
                new PrefItem("13", "東京都"));
    }

    // prefCode -> cities
    public Map<String, List<CityItem>> citiesByPref() {
        return Map.of(
                "13", List.of(
                        new CityItem("13209", "町田市")));
    }

    // zip -> candidates（町田の代表的な郵便番号だけサンプル）
    // 必要なら町田の郵便番号を増やす（あるいはzip機能自体をUIから隠す）
    public Map<String, List<ZipAddressCandidate>> zipMap() {
        return Map.of(
                "1940000", List.of(
                        new ZipAddressCandidate("13", "東京都", "13209", "町田市", "（以下未設定）")),
                "1940013", List.of(
                        new ZipAddressCandidate("13", "東京都", "13209", "町田市", "原町田")),
                "1940022", List.of(
                        new ZipAddressCandidate("13", "東京都", "13209", "町田市", "森野")));
    }
}
