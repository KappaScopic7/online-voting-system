package com.bteam.ovs.demo.seed;

import com.bteam.ovs.auth.entity.Role;
import com.bteam.ovs.demo.json.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;

public class MachidaSangiinSeed {

    public enum Mode {
        REAL_LIKE, MOCK
    }

    private final Mode mode;

    public MachidaSangiinSeed(Mode mode) {
        this.mode = mode;
    }

    public static final String EID_TOKYO_DISTRICT = "SANGIIN_2026_TOKYO_DISTRICT_MACHIDA";
    public static final String EID_TOKYO_PR = "SANGIIN_2026_PR_TOKYO_MACHIDA";
    public static final String EID_JUDGE_REVIEW = "JUDGE_REVIEW_2026_TOKYO_MACHIDA";

    public static final String EID_TOKYO_GOV_2024 = "TOKYO_GOV_2024";

    // public static final String EID_MACHIDA_MAYOR_2026 = "MACHIDA_MAYOR_2026";
    // public static final String EID_MACHIDA_COUNCIL_2026 = "MACHIDA_COUNCIL_2026";

    public static final String PREF_TOKYO = "13";
    public static final String CITY_MACHIDA = "13209";

    public static final String CITY_ALL_TOKYO = "00000";

    public static final String CITY_TACHIKAWA = "13202";

    private static final long CUR_START = -3600L * 24L * 1L;
    private static final long CUR_END = 3600L * 24L * 27L;

    private static final long PAST_START = -3600L * 24L * 600L;
    private static final long PAST_END = -3600L * 24L * 585L;

    // private static final long FUT_2026_LOCAL_START = 3600L * 24L * 40L;
    // private static final long FUT_2026_LOCAL_END = 3600L * 24L * 47L;

    private static final int PAST_DUMMY_CITIZENS = 200;
    private static final int PAST_TG2024_TOTAL_VOTES = 300;

    private static final String CANDIDATE_IMG_BASE = "/assets/candidates/";
    private static final String CANDIDATE_IMG_EXT = ".png";

    private String imageUrlFor(String candidateKey) {
        if (candidateKey == null || candidateKey.isBlank())
            return null;
        return CANDIDATE_IMG_BASE + candidateKey + CANDIDATE_IMG_EXT;
    }

    // public List<PartyJson> parties() {
    // var list = new ArrayList<PartyJson>();

    // // ✅ 2026 比例代表も「苗字党6党」にする（= 2024で使われる政党は出さない）
    // list.addAll(prSurnameParties());

    // // ✅ 東京都選挙区（首都圏大会デモ用：苗字党）
    // list.addAll(tokyoDistrictSurnameParties());

    // return list;
    // }

    // parties() をこれに
    public List<PartyJson> parties() {
        // ✅ 苗字党6つだけを1回だけ登録（重複排除）
        return new ArrayList<>(surnameParties());
    }

    // tokyoDistrictSurnameParties() と prSurnameParties() は削除して、これ1本に統一
    private List<PartyJson> surnameParties() {
        return List.of(
                party("KT", "加藤党", "KT", "#1E88E5", "行政手続きのデジタル化と透明性を推進し、暮らしの不安を減らす。", List.of("行政DX", "透明性", "若者参画")),
                party("HS", "橋本党", "HS", "#43A047", "交通・医療・買い物など生活インフラを整え、地域の不便を減らす。", List.of("地域交通", "医療体制", "生活支援")),
                party("ES", "榎丸党", "ES", "#F4511E", "教育・保育を中心に、家庭の負担を減らして安心して働ける社会へ。",
                        List.of("教育投資", "保育拡充", "子育て支援")),
                party("YY", "イェダム党", "YY", "#8E24AA", "多文化共生と情報格差の解消により、誰もが手続きを迷わない行政へ。",
                        List.of("多文化共生", "多言語化", "生活相談")),
                party("NR", "生田目党", "NR", "#546E7A", "データに基づく政策と財政の見える化で、ムダを減らし生活を守る。",
                        List.of("財政改革", "生活防衛", "中小企業支援")),
                party("YM", "山内党", "YM", "#6D4C41", "地域コミュニティを基盤に、防災・防犯・福祉の連携を強化する。", List.of("防災", "防犯", "福祉連携")));
    }

    // private List<PartyJson> tokyoDistrictSurnameParties() {
    // return List.of(
    // party("KT", "加藤党", "KT", "#1E88E5", "加藤を中心とする政党（デモ用）", List.of("デモ", "苗字党")),
    // party("HS", "橋本党", "HS", "#43A047", "橋本を中心とする政党（デモ用）", List.of("デモ", "苗字党")),
    // party("ES", "榎丸党", "ES", "#F4511E", "榎丸を中心とする政党（デモ用）", List.of("デモ", "苗字党")),
    // party("YY", "イェダム党", "YY", "#8E24AA", "イェダムを中心とする政党（デモ用）", List.of("デモ",
    // "苗字党")),
    // party("NR", "生田目党", "NR", "#546E7A", "生田目を中心とする政党（デモ用）", List.of("デモ",
    // "苗字党")),
    // party("YM", "山内党", "YM", "#6D4C41", "山内を中心とする政党（デモ用）", List.of("デモ",
    // "苗字党")));
    // }

    // ✅ 2026比例代表用（党はこの6つだけ）
    // partyKey は「2026比例専用」にして衝突を避ける（PR_候補キーとも噛み合う）
    // private List<PartyJson> prSurnameParties() {
    // return List.of(
    // party("PR_KT", "加藤党", "加藤", "#1E88E5", "2026比例代表の投票先（デモ用）", List.of("デモ",
    // "比例", "苗字党")),
    // party("PR_HS", "橋本党", "橋本", "#43A047", "2026比例代表の投票先（デモ用）", List.of("デモ",
    // "比例", "苗字党")),
    // party("PR_ES", "榎丸党", "榎丸", "#F4511E", "2026比例代表の投票先（デモ用）", List.of("デモ",
    // "比例", "苗字党")),
    // party("PR_YY", "イェダム党", "イェダム", "#8E24AA", "2026比例代表の投票先（デモ用）", List.of("デモ",
    // "比例", "苗字党")),
    // party("PR_NR", "生田目党", "生田目", "#546E7A", "2026比例代表の投票先（デモ用）", List.of("デモ",
    // "比例", "苗字党")),
    // party("PR_YM", "山内党", "山内", "#6D4C41", "2026比例代表の投票先（デモ用）", List.of("デモ",
    // "比例", "苗字党")));
    // }

    private PartyJson party(String key, String name, String shortName, String color, String desc, List<String> tags) {
        return new PartyJson(key, name, shortName, tags, desc, color);
    }

    // private String name(String real, String mock) {
    // return (mode == Mode.MOCK) ? mock : real;
    // }

    private String person(String realLike, String mock) {
        return (mode == Mode.MOCK) ? mock : realLike;
    }

    public List<CandidateJson> candidates() {
        var all = new ArrayList<CandidateJson>();

        // ✅ 東京都選挙区：6人
        all.addAll(tokyoDistrictCandidates6());

        // ✅ 2026 比例：苗字党6党の「党ダミー候補」に差し替え
        all.addAll(prSurnameProxyCandidates("PR_"));

        all.addAll(judgeCandidates());

        // ✅ 2024等は変更しない
        all.addAll(tokyoGov2024Candidates());

        // all.addAll(machidaMayor2026Candidates());
        // all.addAll(machidaCouncil2026Candidates());

        return all;
    }

    private List<CandidateJson> tokyoDistrictCandidates6() {
        return List.of(
                cand("TD01", "加藤 匠", 21, "KT", "候補者", "町田市出身。現場目線の行政DXで、手続きの待ち時間と不安を減らす。若者の声が届く仕組みづくりを重視。",
                        List.of("行政DX", "子育て支援", "若者参画", "防災情報の統合", "教育のデジタル化")),
                cand("TD02", "橋本 哲志", 22, "HS", "候補者", "地域の交通・医療・買い物の不便を減らすことを最優先。高齢者と子育て世帯が暮らしやすい「生活インフラ」を整える。",
                        List.of("地域交通", "医療体制", "高齢者支援", "物価対策", "災害時の移動支援")),
                cand("TD03", "榎丸 澄香", 21, "ES", "候補者", "教育・保育の現場課題に向き合い、家庭の負担と不安を軽くする仕組みを提案。安心して働ける環境づくりに注力。",
                        List.of("保育拡充", "教育投資", "働き方支援", "給食・学用品支援", "女性の健康支援")),
                cand("TD04", "ユ イェダム", 21, "YY", "候補者", "多文化共生の視点から、暮らしの情報格差をなくす。言語・制度の壁を下げ、誰も取り残さない行政を目指す。",
                        List.of("多文化共生", "生活相談窓口", "行政情報の多言語化", "雇用の安定", "差別解消")),
                cand("TD05", "生田目 凌輔", 21, "NR", "候補者", "データと現場の両方を重視し、ムダを減らして必要な所へ予算を回す。安全保障よりもまず「生活防衛」を強化。",
                        List.of("財政の見える化", "公共事業の点検", "生活防衛", "治安・防犯", "中小企業支援")),
                cand("TD06", "山内 政和", 21, "YM", "候補者", "地域コミュニティの力を伸ばし、防災・治安・子どもの居場所づくりを底上げ。現場の声を政策に反映する。",
                        List.of("地域防災", "防犯", "子どもの居場所", "地域活動支援", "福祉の連携")));
    }

    // ✅ 2026比例（苗字党6党）を候補として作る
    // private List<CandidateJson> prSurnameProxyCandidates(String prefix) {
    // var out = new ArrayList<CandidateJson>();
    // int i = 0;

    // for (var p : prSurnameParties()) {
    // String key = prefix + p.partyKey(); // 例: PR_PR_KT
    // int age = 40 + (i % 10);

    // out.add(new CandidateJson(
    // key,
    // "【比例】" + p.name(),
    // age,
    // p.partyKey(),
    // "比例代表（党）",
    // "比例の投票先（党）を表すダミー候補です。",
    // List.of("比例", "党"),
    // null,
    // imageUrlFor(key)));

    // i++;
    // }
    // return out;
    // }

    // private List<String> proportionalCandidateKeys(String prefix) {
    // var keys = new ArrayList<String>();
    // for (var p : prSurnameParties())
    // keys.add(prefix + p.partyKey()); // 例: PR_PR_KT
    // return keys;
    // }

    // prSurnameProxyCandidates / proportionalCandidateKeys をこれに差し替え
    private List<CandidateJson> prSurnameProxyCandidates(String prefix) {
        var out = new ArrayList<CandidateJson>();
        int i = 0;

        for (var p : surnameParties()) {
            String key = prefix + p.partyKey(); // 例: PR_KT
            int age = 40 + (i % 10);

            out.add(new CandidateJson(
                    key,
                    "【比例】" + p.name(),
                    age,
                    p.partyKey(), // ✅ partyKey は KT/HS/...（重複なし）
                    "比例代表（党）",
                    "比例の投票先（党）を表すダミー候補です。",
                    List.of("比例", "党"),
                    null,
                    imageUrlFor(key)));
            i++;
        }
        return out;
    }

    private List<String> proportionalCandidateKeys(String prefix) {
        var keys = new ArrayList<String>();
        for (var p : surnameParties())
            keys.add(prefix + p.partyKey()); // 例: PR_KT
        return keys;
    }

    private List<CandidateJson> judgeCandidates() {
        return List.of(
                cand("J01", person("高須 順一", "高須 順一郎"), 58, null,
                        "最高裁裁判官", "審査対象の裁判官です。", List.of("国民審査")),
                cand("J02", person("沖野 眞已", "沖野 眞己"), 61, null,
                        "最高裁裁判官", "審査対象の裁判官です。", List.of("国民審査")));
    }

    private List<CandidateJson> tokyoGov2024Candidates() {
        return List.of(
                cand("TG24_01", person("小池 百合子", "小池 ゆきこ"), 71, null, "現職", "都政の継続と改革を訴える", List.of("都政", "継続")),
                cand("TG24_02", person("石丸 伸二", "右丸 伸二"), 41, null, "新人", "行政改革と透明性を掲げる", List.of("改革", "透明性")),
                cand("TG24_03", person("蓮舫", "れんほう"), 56, null, "新人", "暮らしの立て直しを訴える", List.of("生活", "福祉")),
                cand("TG24_04", person("安野 貴博", "高野 貴博"), 33, null, "新人", "テクノロジー活用を提案", List.of("DX", "AI")),
                cand("TG24_05", person("田母神 俊雄", "田母神 俊夫"), 75, null, "新人", "安全保障と危機管理を訴える", List.of("安全保障", "防災")),
                cand("TG24_06", person("清水 国明", "清水 国昭"), 73, null, "新人", "地域防災・教育を重視", List.of("防災", "教育")),
                cand("TG24_07", person("桜井 誠", "桜井 誠一"), 52, null, "新人", "制度の見直しを主張", List.of("制度", "改革")),
                cand("TG24_08", person("内海 聡", "内海 聡士"), 49, null, "新人", "医療・生活の課題を訴える", List.of("医療", "生活")),
                cand("TG24_09", person("ドクター・中松", "ドクター・中まつ"), 96, null, "新人", "発明と都市の未来を語る", List.of("未来", "発明")),

                cand("TG24_10", person("野間口 翔", "野間口 翔太"), 36, null, "新人", "都市の課題解決を提案", List.of("都市", "課題")),
                cand("TG24_11", person("黒川 敦彦", "黒川 敦弘"), 45, null, "新人", "政治参加の拡大を訴える", List.of("参加", "改革")),
                cand("TG24_12", person("河合 悠祐", "河合 悠介"), 43, null, "新人", "投票率向上を訴える", List.of("投票率", "啓発")));
    }

    // private List<CandidateJson> machidaMayor2026Candidates() {
    // return List.of(
    // cand("MY26_01", person("町田 恒一", "まちだ こういち"), 58, null, "現職", "子育てと財政の両立",
    // List.of("子育て", "財政")),
    // cand("MY26_02", person("相原 みなみ", "あいはら みなみ"), 45, null, "新人", "駅前再整備と防災",
    // List.of("再整備", "防災")),
    // cand("MY26_03", person("鶴川 恒一", "つるかわ こういち"), 52, null, "新人", "行政DXで手続き簡素化",
    // List.of("DX", "行政")));
    // }

    // private List<CandidateJson> machidaCouncil2026Candidates() {
    // return List.of(
    // cand("MC26_01", person("南 結衣", "みなみ ゆい"), 34, null, "新人", "保育・教育の現場改善",
    // List.of("教育", "保育")),
    // cand("MC26_02", person("山崎 恒一", "やまざき こういち"), 61, null, "現職", "地域交通と高齢者支援",
    // List.of("交通", "福祉")),
    // cand("MC26_03", person("小山 りく", "こやま りく"), 29, null, "新人", "若者の居場所づくり",
    // List.of("若者", "地域")),
    // cand("MC26_04", person("藤川 まゆ", "ふじかわ まゆ"), 40, null, "新人", "防災インフラの強化",
    // List.of("防災", "インフラ")),
    // cand("MC26_05", person("渋谷 健司", "しぶや けんじ"), 47, null, "新人", "行政の透明化",
    // List.of("透明性", "改革")));
    // }

    private static final int DEFAULT_AGE = 50;

    private CandidateJson cand(
            String key, String name, Integer age, String partyKey,
            String title, String bio, List<String> policies) {

        String imageUrl = imageUrlFor(key);
        int safeAge = (age == null) ? DEFAULT_AGE : age;

        return new CandidateJson(key, name, safeAge, partyKey, title, bio, policies, null, imageUrl);
    }

    public List<ElectionJson> elections() {
        return List.of(
                new ElectionJson(
                        EID_TOKYO_GOV_2024,
                        "東京都知事選挙 2024",
                        "都知事を選ぶ選挙",
                        "DEMO",
                        new ElectionJson.DistrictJson(PREF_TOKYO, CITY_ALL_TOKYO, "東京都"),
                        "SINGLE_CHOICE",
                        PAST_START,
                        PAST_END,
                        tokyoGov2024CandidateKeys()),

                new ElectionJson(
                        EID_TOKYO_DISTRICT,
                        "参議院議員通常選挙 2026",
                        "町田市の有権者が東京都選挙区の候補者から1名を選ぶ。",
                        "UPPER_HOUSE",
                        new ElectionJson.DistrictJson(PREF_TOKYO, CITY_MACHIDA, "東京都（町田市）"),
                        "SINGLE_CHOICE",
                        CUR_START,
                        CUR_END,
                        tokyoDistrictCandidateKeys()),

                new ElectionJson(
                        EID_TOKYO_PR,
                        "参議院議員通常選挙 2026（比例代表）",
                        "比例代表をポイント配分で表現。",
                        "UPPER_HOUSE",
                        new ElectionJson.DistrictJson(PREF_TOKYO, CITY_MACHIDA, "比例（東京/町田）"),
                        "ALLOCATION",
                        CUR_START,
                        CUR_END,
                        proportionalCandidateKeys("PR_")),

                new ElectionJson(
                        EID_JUDGE_REVIEW,
                        "最高裁裁判官 国民審査 2026",
                        "裁判官ごとに2択（信任/罷免）で国民審査を表現する。",
                        "DEMO",
                        new ElectionJson.DistrictJson(PREF_TOKYO, CITY_MACHIDA, "国民審査（町田）"),
                        "JUDGE_REVIEW",
                        CUR_START,
                        CUR_END,
                        List.of("J01", "J02")));
    }

    private List<String> tokyoDistrictCandidateKeys() {
        var keys = new ArrayList<String>();
        for (int i = 1; i <= 6; i++)
            keys.add(String.format("TD%02d", i));
        return keys;
    }

    private List<String> tokyoGov2024CandidateKeys() {
        var keys = new ArrayList<String>();
        for (int i = 1; i <= 12; i++)
            keys.add(String.format("TG24_%02d", i));
        return keys;
    }

    public List<RuleJson> rules() {
        return List.of(
                new RuleJson(EID_TOKYO_DISTRICT, CITY_MACHIDA, 18),
                new RuleJson(EID_TOKYO_PR, CITY_MACHIDA, 18),
                new RuleJson(EID_JUDGE_REVIEW, CITY_MACHIDA, 18),
                new RuleJson(EID_TOKYO_GOV_2024, CITY_ALL_TOKYO, 18));
    }

    public List<CitizenJson> citizens() {
        var base = List.of(
                citizenMachida(uuid("11111111-1111-1111-1111-111111111111"), "加藤", "匠",
                        LocalDate.of(2004, 7, 24), "町田市1-2-3", "M", "1234"),

                citizenMachida(uuid("22222222-2222-2222-2222-222222222222"), "橋本", "哲志",
                        LocalDate.of(2003, 10, 10), "町田市2-3-4", "M", "2345"),

                citizenMachida(uuid("33333333-3333-3333-3333-333333333333"), "イェダム", "ユ",
                        LocalDate.of(2004, 5, 21), "韓国市1-2-3", "M", "3456"),

                citizenOtherCity(uuid("44444444-4444-4444-4444-444444444444"), "榎丸", "澄香",
                        LocalDate.of(1990, 3, 3), "立川市1-1-1", "F", "4567"),

                citizenMachida(uuid("55555555-5555-5555-5555-555555555555"), "山内", "政和",
                        LocalDate.of(2014, 9, 5), "町田市3-4-5", "M", "5678"),

                citizenOtherCity(uuid("66666666-6666-6666-6666-666666666666"), "生田目", "凌輔",
                        LocalDate.of(2022, 12, 25), "大和市1-1-1", "M", "6789"));

        var all = new ArrayList<CitizenJson>(base.size() + PAST_DUMMY_CITIZENS);
        all.addAll(base);
        all.addAll(dummyTokyoCitizensForPast(PAST_DUMMY_CITIZENS));
        return all;
    }

    private CitizenJson citizenMachida(UUID id, String fn, String gn, LocalDate bd, String addr, String gender,
            String pin) {
        return new CitizenJson(id, fn, gn, bd, PREF_TOKYO, CITY_MACHIDA, addr, gender, pin);
    }

    private CitizenJson citizenOtherCity(UUID id, String fn, String gn, LocalDate bd, String addr, String gender,
            String pin) {
        return new CitizenJson(id, fn, gn, bd, PREF_TOKYO, CITY_TACHIKAWA, addr, gender, pin);
    }

    public List<UserJson> users() {
        return List.of(
                new UserJson("voter.ok@example.com", "Passw0rd!!", Role.VOTER, true, true, false,
                        uuid("11111111-1111-1111-1111-111111111111")),

                new UserJson("user.unlinked@example.com", "Passw0rd!!", Role.USER, true, true, false,
                        null),

                new UserJson("voter.locked@example.com", "Passw0rd!!", Role.VOTER, true, true, true,
                        uuid("22222222-2222-2222-2222-222222222222")),

                new UserJson("user.unverified@example.com", "Passw0rd!!", Role.USER, false, true, false,
                        null),

                new UserJson("voter.underage@example.com", "Passw0rd!!", Role.VOTER, true, true, false,
                        uuid("33333333-3333-3333-3333-333333333333")),

                new UserJson("voter.othercity@example.com", "Passw0rd!!", Role.VOTER, true, true, false,
                        uuid("44444444-4444-4444-4444-444444444444")));
    }

    public List<CommitteeJson> committeeAccounts() {
        return List.of(
                new CommitteeJson("machida-committee", "Passw0rd!!", Role.COMMITTEE, PREF_TOKYO, CITY_MACHIDA, true,
                        false),
                new CommitteeJson("admin", "Passw0rd!!", Role.COMMITTEE, PREF_TOKYO, CITY_MACHIDA, true, false));
    }

    public List<VoteJson> voteCasts() {
        var out = new ArrayList<VoteJson>();

        // ✅ 東京都選挙区（6人）なので idx は 0..5
        out.addAll(List.of(
                new VoteJson(EID_TOKYO_DISTRICT, uuid("11111111-1111-1111-1111-111111111111"), 0, -120),
                new VoteJson(EID_TOKYO_DISTRICT, uuid("22222222-2222-2222-2222-222222222222"), 1, -240),
                new VoteJson(EID_TOKYO_DISTRICT, uuid("33333333-3333-3333-3333-333333333333"), 3, -360),
                new VoteJson(EID_TOKYO_DISTRICT, uuid("44444444-4444-4444-4444-444444444444"), 2, -480)));

        // ✅ 2024はそのまま
        out.addAll(tokyoGov2024DummyVotes(PAST_TG2024_TOTAL_VOTES, PAST_DUMMY_CITIZENS));

        return out;
    }

    public List<AllocVoteJson> allocVoteCasts() {
        // ✅ 2026比例：6党しかないので idx は 0..5（= PR候補の並びに合わせる）
        return List.of(
                alloc(EID_TOKYO_PR, uuid("11111111-1111-1111-1111-111111111111"), -300,
                        List.of(ai("CANDIDATE", 0, 60), ai("CANDIDATE", 1, 40))),
                alloc(EID_TOKYO_PR, uuid("22222222-2222-2222-2222-222222222222"), -320,
                        List.of(ai("CANDIDATE", 2, 50), ai("CANDIDATE", 3, 50))),
                alloc(EID_TOKYO_PR, uuid("33333333-3333-3333-3333-333333333333"), -340,
                        List.of(ai("CANDIDATE", 4, 100))),
                alloc(EID_TOKYO_PR, uuid("44444444-4444-4444-4444-444444444444"), -360,
                        List.of(ai("CANDIDATE", 5, 70), ai("CANDIDATE", 0, 30))));
    }

    public List<JudgeReviewVoteJson> judgeReviewVoteCasts() {
        return List.of(
                new JudgeReviewVoteJson(
                        EID_JUDGE_REVIEW,
                        uuid("11111111-1111-1111-1111-111111111111"),
                        -180,
                        List.of(
                                new JudgeReviewVoteJson.ItemJson(0, "OK"),
                                new JudgeReviewVoteJson.ItemJson(1, "NO"))));
    }

    private AllocVoteJson alloc(String eid, UUID cid, long off, List<AllocVoteJson.AllocItemJson> items) {
        return new AllocVoteJson(eid, cid, off, items);
    }

    private AllocVoteJson.AllocItemJson ai(String type, Integer idx, Integer pts) {
        return new AllocVoteJson.AllocItemJson(type, idx, pts);
    }

    private List<CitizenJson> dummyTokyoCitizensForPast(int n) {
        var out = new ArrayList<CitizenJson>(n);
        for (int i = 1; i <= n; i++) {
            UUID id = stableUuid("DUMMY_TOKYO_" + i);
            LocalDate bd = LocalDate.of(1955 + (i % 40), 1 + (i % 12), 1 + (i % 28));
            String gender = (i % 2 == 0) ? "M" : "F";
            String pin = String.format("%04d", 1000 + (i % 9000));
            out.add(new CitizenJson(
                    id,
                    "都民", "ダミー" + i,
                    bd,
                    PREF_TOKYO,
                    CITY_ALL_TOKYO,
                    "東京都ダミー住所" + i,
                    gender,
                    pin));
        }
        return out;
    }

    private List<VoteJson> tokyoGov2024DummyVotes(int totalVotes, int dummyCitizenCount) {
        int[] weights = new int[] {
                45,
                20,
                18,
                5,
                4,
                3,
                2,
                1,
                1,
                1,
                0,
                0
        };
        int wsum = 0;
        for (int w : weights)
            wsum += w;
        if (wsum <= 0)
            return List.of();

        var out = new ArrayList<VoteJson>(totalVotes);

        for (int i = 0; i < totalVotes; i++) {
            int citizenNo = (i % dummyCitizenCount) + 1;
            UUID cid = stableUuid("DUMMY_TOKYO_" + citizenNo);

            int r = (i * 37) % wsum;
            int idx = 0;
            for (int k = 0; k < weights.length; k++) {
                r -= weights[k];
                if (r < 0) {
                    idx = k;
                    break;
                }
            }

            long off = PAST_START + 3600L * 24L * (1 + (i % 14));

            out.add(new VoteJson(EID_TOKYO_GOV_2024, cid, idx, off));
        }
        return out;
    }

    private static UUID stableUuid(String key) {
        return UUID.nameUUIDFromBytes(key.getBytes(StandardCharsets.UTF_8));
    }

    private static UUID uuid(String s) {
        return UUID.fromString(s);
    }
}
