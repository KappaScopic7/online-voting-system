package com.bteam.ovs.demo.seed;

import com.bteam.ovs.auth.entity.Role;
import com.bteam.ovs.demo.json.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;

/**
 * 町田市要件を満たす「参院選（候補者/比例）」＋「裁判官〇×（国民審査風）」のデモデータ + 過去/未来の検証用選挙。
 *
 * 現在（想定）:
 * - 2026/02/08〜2026/03/08 の期間に「参院（候補/比例）」＋「国民審査」を開催中にする（seed実行日が 2026/02/09
 * でも開催中）。
 *
 * 過去（検証用）:
 * - 2024 都知事選（告示 2024/06/20 / 投開票 2024/07/07 相当）を「終了」として入れる。
 * ※実データに寄せるが、全候補56人の完全再現は重すぎるので “代表候補 + 一部抜粋 + ダミー” とする。
 *
 * 未来（想像）:
 * - 2026 町田市長/市議（想像）
 *
 * NOTE:
 * - ElectionType は「プロジェクト内の enum 名」と一致必須。
 * ここでは安全のため、都知事系も type は "DEMO" に寄せる（TOKYO_GOV など未定義を使わない）。
 * - RuleJson は cityCode が blank 不可なので、「都全域」を CITY_ALL_TOKYO="00000" で表現する。
 *
 * 追加（おすすめ）:
 * - 過去選挙（都知事2024）の「結果画面」をちゃんと見せるために、
 * 過去専用のダミー都民を生成して、都知事2024に“それっぽい分布”の投票を挿入する。
 * （安定UUID + 決定的な分布 → seedし直しても同じ結果）
 */
public class MachidaSangiinSeed {

    public enum Mode {
        REAL_LIKE, MOCK
    }

    private final Mode mode;

    public MachidaSangiinSeed(Mode mode) {
        this.mode = mode;
    }

    // ---------------------------
    // Keys（安定キー）
    // ---------------------------
    // ===== 現在（2026/02/08〜03/08）=====
    public static final String EID_TOKYO_DISTRICT = "SANGIIN_2026_TOKYO_DISTRICT_MACHIDA";
    public static final String EID_TOKYO_PR = "SANGIIN_2026_PR_TOKYO_MACHIDA";
    public static final String EID_JUDGE_REVIEW = "JUDGE_REVIEW_2026_TOKYO_MACHIDA";

    // ===== 過去検証用（2024）=====
    public static final String EID_TOKYO_GOV_2024 = "TOKYO_GOV_2024";

    // ===== 未来（想像）=====
    public static final String EID_MACHIDA_MAYOR_2026 = "MACHIDA_MAYOR_2026";
    public static final String EID_MACHIDA_COUNCIL_2026 = "MACHIDA_COUNCIL_2026";

    // ---------------------------
    // District codes
    // ---------------------------
    public static final String PREF_TOKYO = "13";
    public static final String CITY_MACHIDA = "13209";

    // 都全域（validator回避・都知事/都全域参院に使用）
    public static final String CITY_ALL_TOKYO = "00000";

    // 市外テスト用（例：立川市）
    public static final String CITY_TACHIKAWA = "13202";

    // ---------------------------
    // Time offsets (seconds)
    // ---------------------------
    // 現在選挙：2026/02/08〜03/08 を「seed実行時点」から相対で表現
    // seed実行日が 2026/02/09 の場合でも開催中にしたいので「昨日開始・27日後終了（合計28日）」
    private static final long CUR_START = -3600L * 24L * 1L;
    private static final long CUR_END = 3600L * 24L * 27L;

    // 過去（2024 都知事）: 終了済みの相対表現（開始〜終了が過去になるように）
    private static final long PAST_START = -3600L * 24L * 600L; // 約600日前開始
    private static final long PAST_END = -3600L * 24L * 585L; // 約585日前終了（約15日）

    // 未来（想像）
    private static final long FUT_2026_LOCAL_START = 3600L * 24L * 40L;
    private static final long FUT_2026_LOCAL_END = 3600L * 24L * 47L;

    // ---------------------------
    // Past demo volume (recommended)
    // ---------------------------
    private static final int PAST_DUMMY_CITIZENS = 200; // 結果画面の見栄え用（20〜500で調整）
    private static final int PAST_TG2024_TOTAL_VOTES = 300; // 票数（グラフが“それっぽい”）

    // ---------------------------
    // Parties（比例・党）
    // ---------------------------
    public List<PartyJson> parties() {
        return List.of(
                party("LDP", name("自由民主党", "自由みんしゅ党"), "自民", "#D81B60", "経済と安定を掲げる大きな政党", List.of("保守", "現実路線")),
                party("CDP", name("立憲民主党", "立憲くらし党"), "立憲", "#1976D2", "生活と権利を重視する政党", List.of("リベラル", "福祉")),
                party("KOMEI", name("公明党", "公明の輪"), "公明", "#FFA000", "福祉・教育を重視する政党", List.of("中道", "福祉")),
                party("Ishin", name("日本維新の会", "維新フロンティア"), "維新", "#009688", "改革と行政効率を掲げる政党", List.of("改革", "小さな政府")),
                party("JCP", name("日本共産党", "共産くらぶ"), "共産", "#E53935", "格差是正と平和を掲げる政党", List.of("左派", "平和")),
                party("DPP", name("国民民主党", "国民バランス党"), "国民", "#43A047", "現実的な改革と成長を掲げる政党", List.of("中道", "改革")),
                party("Reiwa", name("れいわ新選組", "れいわ新風"), "れいわ", "#8E24AA", "積極財政と生活支援を掲げる", List.of("積極財政", "福祉")),
                party("Sansei", name("参政党", "参画党"), "参政", "#6D4C41", "参加型の政治を掲げる政党", List.of("保守", "参加")),
                party("N党", name("ＮＨＫ党", "N☆HK党"), "N党", "#546E7A", "既存制度改革を掲げる", List.of("改革")),
                party("Team", name("チームみらい", "チームみらいLAB"), "みらい", "#00ACC1", "未来技術と改革を掲げる", List.of("テック", "改革")),
                party("Shamin", name("社会民主党", "社民レインボー"), "社民", "#7CB342", "人権・福祉を重視する", List.of("人権", "福祉")),
                party("Hoshuto", name("日本保守党", "保守の杜"), "保守", "#5D4037", "伝統と安全保障を重視する", List.of("保守")),
                party("Rengou", name("無所属連合", "むしょぞく連盟"), "無連", "#90A4AE", "特定政党に属さない連合", List.of("無所属")),
                party("Saisei", name("再生の道", "再生ロード"), "再生", "#3949AB", "再建と改革を掲げる", List.of("改革")),
                party("Seishin", name("日本誠真会", "誠心会"), "誠心", "#00897B", "誠実さを掲げる小規模政党", List.of("中道")),
                party("Kaikaku", name("日本改革党", "改革プラン党"), "改革", "#F4511E", "制度改革を掲げる小規模政党", List.of("改革")));
    }

    private PartyJson party(String key, String name, String shortName, String color, String desc, List<String> tags) {
        return new PartyJson(key, name, shortName, tags, desc, color);
    }

    private String name(String real, String mock) {
        return (mode == Mode.MOCK) ? mock : real;
    }

    private String person(String realLike, String mock) {
        return (mode == Mode.MOCK) ? mock : realLike;
    }

    // ---------------------------
    // Candidates
    // ---------------------------
    public List<CandidateJson> candidates() {
        var all = new ArrayList<CandidateJson>();

        // 現在（参院 + 比例 + 国民審査）
        all.addAll(tokyoDistrictCandidates32()); // TD01..TD32
        all.addAll(proportionalPartyProxyCandidates("PR_")); // PR_<partyKey>
        all.addAll(judgeReviewTwoChoiceCandidates()); // JR_OK / JR_NO

        // 過去（都知事 2024）
        all.addAll(tokyoGov2024Candidates()); // TG24_*

        // 未来（想像）
        all.addAll(machidaMayor2026Candidates()); // MY26_*
        all.addAll(machidaCouncil2026Candidates()); // MC26_*
        return all;
    }

    // ===== 現在：参院 東京選挙区（32）=====
    private List<CandidateJson> tokyoDistrictCandidates32() {
        return List.of(
                cand("TD01", person("吉良 よし子", "吉良 よしこ"), 51, "JCP", "現職", "地域の声を国政へ", List.of("福祉", "平和")),
                cand("TD02", person("山本 ジョージ", "山元 ジョージ"), 60, "Reiwa", "元職", "生活再建を訴える", List.of("生活支援")),
                cand("TD03", person("吉永 アイ", "吉長 アイ"), 35, null, "新人", "現場主義で挑む", List.of("現場")),
                cand("TD04", person("土居 けんしん", "土井 けんしん"), 33, null, "新人", "若者の選択肢を広げる", List.of("若者", "教育")),
                cand("TD05", person("藤川 ひろあき", "藤河 ひろあき"), 44, "Kaikaku", "新人", "制度を整える", List.of("改革")),
                cand("TD06", person("西 みゆか", "西 みゆか"), 55, "Shamin", "元職", "人権と福祉を守る", List.of("人権", "福祉")),
                cand("TD07", person("小坂 英二", "小坂 英司"), 50, "Hoshuto", "新人", "伝統と安全を重視", List.of("安全保障")),
                cand("TD08", person("さや", "さやか"), null, "Sansei", "新人", "参加型政治を掲げる", List.of("参加", "教育")),
                cand("TD09", person("みねしま 侑也", "みねしま 悠也"), 29, "Team", "新人", "テックで行政改革", List.of("DX", "改革")),
                cand("TD10", person("たけみ 敬三", "たけみ 啓三"), 72, "LDP", "元職", "医療制度に詳しい", List.of("医療", "制度")),
                cand("TD11", person("おくむら まさよし", "おくむら まさよし"), 43, "CDP", "新人", "暮らしを支える", List.of("福祉", "子育て")),
                cand("TD12", person("牛田 まゆ", "牛田 まゆ"), 39, "DPP", "新人", "成長と分配の両立", List.of("成長", "賃上げ")),
                cand("TD13", person("酒井 ともひろ", "坂井 ともひろ"), 48, "Saisei", "新人", "政治の信頼回復", List.of("透明性")),
                cand("TD14", person("福村 康廣", "福村 恒一"), 67, "KOMEI", "新人", "安心の福祉政策", List.of("福祉")),
                cand("TD15", person("桑島 康文", "桑島 恒一"), 58, "Kaikaku", "新人", "技術と産業の強化", List.of("産業")),
                cand("TD16", person("渋谷 りく", "渋谷 りく"), 26, "Ishin", "新人", "都市の効率化", List.of("改革", "行政")),
                cand("TD17", person("奥村 よしひろ", "奥村 よしひろ"), 47, "DPP", "新人", "実務重視の政治", List.of("実務")),
                cand("TD18", person("吉田 あや", "吉田 あや"), 36, "Saisei", "新人", "再建と改革", List.of("改革")),
                cand("TD19", person("鈴木 大地", "鈴木 大地"), 58, "LDP", "新人", "スポーツと健康", List.of("健康", "教育")),
                cand("TD20", person("塩村 あやか", "汐村 あやか"), 45, "CDP", "現職", "女性と子育て支援", List.of("子育て", "ジェンダー")),
                cand("TD21", person("よしざわ 恵理", "よしざわ 絵里"), 40, null, "新人", "地域密着", List.of("地域")),
                cand("TD22", person("市川 たけしま", "市川 たけしま"), 46, "Kaikaku", "新人", "税制と制度", List.of("税制")),
                cand("TD23", person("川村 ゆうだい", "河村 ゆうだい"), 39, "KOMEI", "新人", "子育てと教育", List.of("教育", "福祉")),
                cand("TD24", person("おときた 駿", "おときた 駿"), 41, "Ishin", "新人", "改革断行", List.of("改革")),
                cand("TD25", person("平野 雨龍", "平野 雨竜"), 30, null, "新人", "多様性と文化", List.of("文化", "多様性")),
                cand("TD26", person("山尾 しおり", "山尾 しおり"), 50, null, "新人", "制度の見直し", List.of("改革")),
                cand("TD27", person("ちば ひとし", "ちば ひとし"), 52, "Seishin", "新人", "誠実な政治", List.of("誠実")),
                cand("TD28", person("増田 昇", "増田 のぼる"), 64, null, "新人", "地域の課題解決", List.of("地域")),
                cand("TD29", person("つじ 健太郎", "つじ 健太郎"), 49, "Rengou", "新人", "無所属の連携", List.of("連携")),
                cand("TD30", person("早川 幹夫", "早川 幹夫"), 61, "Hoshuto", "新人", "安全と秩序", List.of("治安")),
                cand("TD31", person("石丸 幸人", "石丸 幸斗"), 42, "N党", "新人", "制度改革", List.of("改革")),
                cand("TD32", person("高橋 健司", "高橋 健司"), 57, null, "新人", "地域と経済", List.of("経済")));
    }

    // ===== 現在/未来：比例（政党＝候補）=====
    private List<CandidateJson> proportionalPartyProxyCandidates(String prefix) {
        var out = new ArrayList<CandidateJson>();
        for (var p : parties()) {
            out.add(new CandidateJson(
                    prefix + p.partyKey(),
                    "【比例】" + p.name(),
                    null,
                    p.partyKey(),
                    "比例代表（党）",
                    "比例の投票先（党）を表すダミー候補です。",
                    List.of("比例", "党"),
                    null,
                    null));
        }
        return out;
    }

    // ===== 現在：国民審査（2択）=====
    private List<CandidateJson> judgeReviewTwoChoiceCandidates() {
        return List.of(
                new CandidateJson("JR_OK", "信任（〇）", null, null, "国民審査", "裁判官を信任します。", List.of("審査"), null, null),
                new CandidateJson("JR_NO", "罷免（×）", null, null, "国民審査", "裁判官を罷免します。", List.of("審査"), null, null));
    }

    // ===== 過去：都知事 2024（代表 + 抜粋 + ダミー）=====
    private List<CandidateJson> tokyoGov2024Candidates() {
        return List.of(
                cand("TG24_01", person("小池 百合子", "小池 ゆりこ"), 71, null, "現職", "都政の継続と改革を訴える", List.of("都政", "継続")),
                cand("TG24_02", person("石丸 伸二", "石丸 しんじ"), 41, null, "新人", "行政改革と透明性を掲げる", List.of("改革", "透明性")),
                cand("TG24_03", person("蓮舫", "れんほう"), 56, null, "新人", "暮らしの立て直しを訴える", List.of("生活", "福祉")),
                cand("TG24_04", person("安野 貴博", "安野 たかひろ"), 33, null, "新人", "テクノロジー活用を提案", List.of("DX", "AI")),
                cand("TG24_05", person("田母神 俊雄", "たもがみ としお"), 75, null, "新人", "安全保障と危機管理を訴える", List.of("安全保障", "防災")),
                cand("TG24_06", person("清水 国明", "しみず くにあき"), 73, null, "新人", "地域防災・教育を重視", List.of("防災", "教育")),
                cand("TG24_07", person("桜井 誠", "さくらい まこと"), 52, null, "新人", "制度の見直しを主張", List.of("制度", "改革")),
                cand("TG24_08", person("内海 聡", "うつみ さとる"), 49, null, "新人", "医療・生活の課題を訴える", List.of("医療", "生活")),
                cand("TG24_09", person("ドクター・中松", "ドクター なかまつ"), 96, null, "新人", "発明と都市の未来を語る", List.of("未来", "発明")),
                // ダミー
                cand("TG24_10", person("野間口 翔", "のまぐち しょう"), 36, null, "新人", "都市の課題解決を提案", List.of("都市", "課題")),
                cand("TG24_11", person("黒川 敦彦", "くろかわ あつひこ"), 45, null, "新人", "政治参加の拡大を訴える", List.of("参加", "改革")),
                cand("TG24_12", person("河合 悠祐", "かわい ゆうすけ"), 43, null, "新人", "投票率向上を訴える", List.of("投票率", "啓発")));
    }

    // ===== 未来：町田市長 2026（想像）=====
    private List<CandidateJson> machidaMayor2026Candidates() {
        return List.of(
                cand("MY26_01", person("町田 恒一", "まちだ こういち"), 58, null, "現職", "子育てと財政の両立", List.of("子育て", "財政")),
                cand("MY26_02", person("相原 みなみ", "あいはら みなみ"), 45, null, "新人", "駅前再整備と防災", List.of("再整備", "防災")),
                cand("MY26_03", person("鶴川 恒一", "つるかわ こういち"), 52, null, "新人", "行政DXで手続き簡素化", List.of("DX", "行政")));
    }

    // ===== 未来：町田市議 2026（想像）=====
    private List<CandidateJson> machidaCouncil2026Candidates() {
        return List.of(
                cand("MC26_01", person("南 結衣", "みなみ ゆい"), 34, null, "新人", "保育・教育の現場改善", List.of("教育", "保育")),
                cand("MC26_02", person("山崎 恒一", "やまざき こういち"), 61, null, "現職", "地域交通と高齢者支援", List.of("交通", "福祉")),
                cand("MC26_03", person("小山 りく", "こやま りく"), 29, null, "新人", "若者の居場所づくり", List.of("若者", "地域")),
                cand("MC26_04", person("藤川 まゆ", "ふじかわ まゆ"), 40, null, "新人", "防災インフラの強化", List.of("防災", "インフラ")),
                cand("MC26_05", person("渋谷 健司", "しぶや けんじ"), 47, null, "新人", "行政の透明化", List.of("透明性", "改革")));
    }

    private CandidateJson cand(String key, String name, Integer age, String partyKey, String title, String bio,
            List<String> policies) {
        return new CandidateJson(key, name, age, partyKey, title, bio, policies, null, null);
    }

    // ---------------------------
    // Elections
    // ---------------------------
    public List<ElectionJson> elections() {
        return List.of(
                // ===== 過去：都知事 2024（終了）=====
                new ElectionJson(
                        EID_TOKYO_GOV_2024,
                        "東京都知事選挙 2024（検証用デモ）",
                        "都知事を選ぶ選挙（検証用：終了データ）。",
                        "DEMO", // ✅ ElectionType enum 未定義回避（TOKYO_GOV を使わない）
                        new ElectionJson.DistrictJson(PREF_TOKYO, CITY_ALL_TOKYO, "東京都"),
                        "SINGLE_CHOICE",
                        PAST_START,
                        PAST_END,
                        tokyoGov2024CandidateKeys()),

                // ===== 現在：参院（2026/02/08〜03/08相当）=====
                new ElectionJson(
                        EID_TOKYO_DISTRICT,
                        "参議院議員通常選挙 2026（東京都選挙区） - 町田モデル",
                        "町田市の有権者が東京都選挙区の候補者から1名を選ぶ（デモ）。",
                        "UPPER_HOUSE",
                        new ElectionJson.DistrictJson(PREF_TOKYO, CITY_MACHIDA, "東京都（町田市）"),
                        "SINGLE_CHOICE",
                        CUR_START,
                        CUR_END,
                        tokyoDistrictCandidateKeys()),
                new ElectionJson(
                        EID_TOKYO_PR,
                        "参議院議員通常選挙 2026（比例代表） - 町田モデル",
                        "比例代表をポイント配分で表現（政党ダミー候補へ配分）。",
                        "UPPER_HOUSE",
                        new ElectionJson.DistrictJson(PREF_TOKYO, CITY_MACHIDA, "比例（東京/町田）"),
                        "ALLOCATION",
                        CUR_START,
                        CUR_END,
                        proportionalCandidateKeys("PR_")),
                new ElectionJson(
                        EID_JUDGE_REVIEW,
                        "最高裁裁判官 国民審査 2026（デモ） - 町田モデル",
                        "2択（信任/罷免）で国民審査を表現するデモ。",
                        "DEMO",
                        new ElectionJson.DistrictJson(PREF_TOKYO, CITY_MACHIDA, "国民審査（町田）"),
                        "TWO_CHOICES",
                        CUR_START,
                        CUR_END,
                        List.of("JR_OK", "JR_NO")),

                // ===== 未来：町田 市長 2026（想像）=====
                new ElectionJson(
                        EID_MACHIDA_MAYOR_2026,
                        "町田市長選挙 2026（想像デモ）",
                        "町田市長を選ぶ選挙（想像）。",
                        "DEMO",
                        new ElectionJson.DistrictJson(PREF_TOKYO, CITY_MACHIDA, "町田市"),
                        "SINGLE_CHOICE",
                        FUT_2026_LOCAL_START,
                        FUT_2026_LOCAL_END,
                        List.of("MY26_01", "MY26_02", "MY26_03")),

                // ===== 未来：町田 市議 2026（想像）=====
                new ElectionJson(
                        EID_MACHIDA_COUNCIL_2026,
                        "町田市議会議員選挙 2026（想像デモ）",
                        "町田市議を選ぶ選挙（想像）。",
                        "DEMO",
                        new ElectionJson.DistrictJson(PREF_TOKYO, CITY_MACHIDA, "町田市"),
                        "SINGLE_CHOICE",
                        FUT_2026_LOCAL_START,
                        FUT_2026_LOCAL_END,
                        List.of("MC26_01", "MC26_02", "MC26_03", "MC26_04", "MC26_05")));
    }

    // ---------------------------
    // Candidate key lists
    // ---------------------------
    private List<String> tokyoDistrictCandidateKeys() {
        var keys = new ArrayList<String>();
        for (int i = 1; i <= 32; i++)
            keys.add(String.format("TD%02d", i));
        return keys;
    }

    private List<String> proportionalCandidateKeys(String prefix) {
        var keys = new ArrayList<String>();
        for (var p : parties())
            keys.add(prefix + p.partyKey());
        return keys;
    }

    private List<String> tokyoGov2024CandidateKeys() {
        var keys = new ArrayList<String>();
        for (int i = 1; i <= 12; i++)
            keys.add(String.format("TG24_%02d", i));
        return keys;
    }

    // ---------------------------
    // Rules
    // ---------------------------
    public List<RuleJson> rules() {
        return List.of(
                // 現在（町田市民のみ）
                new RuleJson(EID_TOKYO_DISTRICT, CITY_MACHIDA, 18),
                new RuleJson(EID_TOKYO_PR, CITY_MACHIDA, 18),
                new RuleJson(EID_JUDGE_REVIEW, CITY_MACHIDA, 18),

                // 過去（都全域）
                new RuleJson(EID_TOKYO_GOV_2024, CITY_ALL_TOKYO, 18),

                // 未来（町田市民のみ）
                new RuleJson(EID_MACHIDA_MAYOR_2026, CITY_MACHIDA, 18),
                new RuleJson(EID_MACHIDA_COUNCIL_2026, CITY_MACHIDA, 18));
    }

    // ---------------------------
    // Citizens / Users / Committee
    // ---------------------------
    public List<CitizenJson> citizens() {
        var base = List.of(
                // 町田・成人（OK）
                citizenMachida(uuid("11111111-1111-1111-1111-111111111111"), "町田", "太郎",
                        LocalDate.of(1995, 1, 1), "町田市1-2-3", "M", "1234"),

                // 町田・成人（OK）
                citizenMachida(uuid("22222222-2222-2222-2222-222222222222"), "相原", "花子",
                        LocalDate.of(2000, 5, 21), "町田市4-5-6", "F", "2345"),

                // 町田・未成年（NG）
                citizenMachida(uuid("33333333-3333-3333-3333-333333333333"), "南", "次郎",
                        LocalDate.now().minusYears(16), "町田市7-8-9", "M", "3456"),

                // 市外・成人（NG） ※ cityCode を町田以外にする
                citizenOtherCity(uuid("44444444-4444-4444-4444-444444444444"), "横浜", "花",
                        LocalDate.of(1990, 3, 3), "立川市1-1-1", "F", "4567"));

        // 過去結果表示用：都全域のダミー都民を追加
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
                // すぐ投票できる（町田・成人・紐付け済み）
                new UserJson("voter.ok@example.com", "Passw0rd!!", Role.VOTER, true, true, false,
                        uuid("11111111-1111-1111-1111-111111111111")),

                // 本人認証リンク体験用（未紐付け）
                new UserJson("user.unlinked@example.com", "Passw0rd!!", Role.USER, true, true, false,
                        null),

                // ロック状態
                new UserJson("voter.locked@example.com", "Passw0rd!!", Role.VOTER, true, true, true,
                        uuid("22222222-2222-2222-2222-222222222222")),

                // メール未認証
                new UserJson("user.unverified@example.com", "Passw0rd!!", Role.USER, false, true, false,
                        null),

                // 未成年（町田・未成年 citizen）
                new UserJson("voter.underage@example.com", "Passw0rd!!", Role.VOTER, true, true, false,
                        uuid("33333333-3333-3333-3333-333333333333")),

                // 市外（立川 citizen）
                new UserJson("voter.othercity@example.com", "Passw0rd!!", Role.VOTER, true, true, false,
                        uuid("44444444-4444-4444-4444-444444444444")));
    }

    public List<CommitteeJson> committeeAccounts() {
        return List.of(
                new CommitteeJson("machida-committee", "Passw0rd!!", Role.COMMITTEE, PREF_TOKYO, CITY_MACHIDA, true,
                        false),
                new CommitteeJson("demo-admin", "Passw0rd!!", Role.COMMITTEE, PREF_TOKYO, CITY_MACHIDA, true, false));
    }

    // ---------------------------
    // Votes（通常投票）
    // ---------------------------
    public List<VoteJson> voteCasts() {
        var out = new ArrayList<VoteJson>();

        // ※ candidateIndex は「その election の candidates 配列の index」
        // 現在は「参院32」+「国民審査2」
        out.addAll(List.of(
                // 東京都選挙区（候補32）
                new VoteJson(EID_TOKYO_DISTRICT, uuid("11111111-1111-1111-1111-111111111111"), 7, -120), // TD08
                new VoteJson(EID_TOKYO_DISTRICT, uuid("22222222-2222-2222-2222-222222222222"), 11, -240), // TD12
                new VoteJson(EID_TOKYO_DISTRICT, uuid("33333333-3333-3333-3333-333333333333"), 18, -360), // TD19
                new VoteJson(EID_TOKYO_DISTRICT, uuid("44444444-4444-4444-4444-444444444444"), 22, -480), // TD23

                // 国民審査（2択）
                new VoteJson(EID_JUDGE_REVIEW, uuid("11111111-1111-1111-1111-111111111111"), 0, -60), // 信任
                new VoteJson(EID_JUDGE_REVIEW, uuid("22222222-2222-2222-2222-222222222222"), 1, -90) // 罷免
        ));

        // 過去：都知事 2024 の“それっぽい投票”を追加（結果画面の見栄え用）
        out.addAll(tokyoGov2024DummyVotes(PAST_TG2024_TOTAL_VOTES, PAST_DUMMY_CITIZENS));

        return out;
    }

    // ---------------------------
    // Alloc Votes（比例ポイント投票）
    // ---------------------------
    public List<AllocVoteJson> allocVoteCasts() {
        // candidateIndex は proportionalCandidateKeys("PR_") の index（party順）
        return List.of(
                alloc(EID_TOKYO_PR, uuid("11111111-1111-1111-1111-111111111111"), -300,
                        List.of(ai("CANDIDATE", 0, 60), ai("CANDIDATE", 6, 40))), // LDP60 + Reiwa40
                alloc(EID_TOKYO_PR, uuid("22222222-2222-2222-2222-222222222222"), -320,
                        List.of(ai("CANDIDATE", 1, 50), ai("CANDIDATE", 2, 50))),
                alloc(EID_TOKYO_PR, uuid("33333333-3333-3333-3333-333333333333"), -340,
                        List.of(ai("CANDIDATE", 3, 100))),
                alloc(EID_TOKYO_PR, uuid("44444444-4444-4444-4444-444444444444"), -360,
                        List.of(ai("CANDIDATE", 4, 70), ai("CANDIDATE", 5, 30))));
    }

    private AllocVoteJson alloc(String eid, UUID cid, long off, List<AllocVoteJson.AllocItemJson> items) {
        return new AllocVoteJson(eid, cid, off, items);
    }

    private AllocVoteJson.AllocItemJson ai(String type, Integer idx, Integer pts) {
        return new AllocVoteJson.AllocItemJson(type, idx, pts);
    }

    // ---------------------------
    // Past demo: dummy citizens + votes
    // ---------------------------

    /** 過去専用：都全域のダミー都民（安定UUID） */
    private List<CitizenJson> dummyTokyoCitizensForPast(int n) {
        var out = new ArrayList<CitizenJson>(n);
        for (int i = 1; i <= n; i++) {
            UUID id = stableUuid("DUMMY_TOKYO_" + i);
            // 18歳以上に固定（30〜70歳相当）
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

    /**
     * 過去：都知事2024の“それっぽい分布”の投票を決定的に生成する。
     *
     * - candidateIndex は TG24_01..12 の順（0..11）
     * - 乱数は使わず、seedし直しても毎回同じ結果が出る（デモに便利）
     */
    private List<VoteJson> tokyoGov2024DummyVotes(int totalVotes, int dummyCitizenCount) {
        // TG24_01..TG24_12 の candidateIndex: 0..11
        // それっぽい重み（合計100）
        int[] weights = new int[] {
                45, // 0: 小池
                20, // 1: 石丸
                18, // 2: 蓮舫
                5, // 3: 安野
                4, // 4: 田母神
                3, // 5: 清水
                2, // 6: 桜井
                1, // 7: 内海
                1, // 8: 中松
                1, // 9: ダミー
                0, // 10: ダミー
                0 // 11: ダミー
        };
        int wsum = 0;
        for (int w : weights)
            wsum += w;
        if (wsum <= 0)
            return List.of();

        var out = new ArrayList<VoteJson>(totalVotes);

        for (int i = 0; i < totalVotes; i++) {
            // 1票=1都民（重複してもDB側で弾く設計なら totalVotes <= dummyCitizenCount 推奨）
            int citizenNo = (i % dummyCitizenCount) + 1;
            UUID cid = stableUuid("DUMMY_TOKYO_" + citizenNo);

            // 決定的に候補indexを選択
            int r = (i * 37) % wsum;
            int idx = 0;
            for (int k = 0; k < weights.length; k++) {
                r -= weights[k];
                if (r < 0) {
                    idx = k;
                    break;
                }
            }

            // PAST期間内っぽく：開始から 1〜14日あたり
            long off = PAST_START + 3600L * 24L * (1 + (i % 14));

            out.add(new VoteJson(EID_TOKYO_GOV_2024, cid, idx, off));
        }
        return out;
    }

    private static UUID stableUuid(String key) {
        return UUID.nameUUIDFromBytes(key.getBytes(StandardCharsets.UTF_8));
    }

    // ---------------------------
    // Utils
    // ---------------------------
    private static UUID uuid(String s) {
        return UUID.fromString(s);
    }
}
