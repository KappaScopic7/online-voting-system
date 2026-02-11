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
    // Image URLs（最終形）
    // ---------------------------
    private static final String CANDIDATE_IMG_BASE = "/assets/candidates/";
    private static final String CANDIDATE_IMG_EXT = ".png";

    private String imageUrlFor(String candidateKey) {
        if (candidateKey == null || candidateKey.isBlank())
            return null;
        return CANDIDATE_IMG_BASE + candidateKey + CANDIDATE_IMG_EXT;
    }

    // ---------------------------
    // Parties（党マスタ：全て）
    // ---------------------------
    public List<PartyJson> parties() {
        var list = new ArrayList<PartyJson>();

        list.addAll(proportionalParties());

        list.add(party("Minna", name("みんなでつくる党", "みんなでこわす党"), "みつ", "#78909C", "小規模政党", List.of("小党")));
        list.add(party("SekaiHeiwa", name("世界平和党", "社会平和党"), "平和", "#AED581", "小規模政党", List.of("小党")));
        list.add(party("Kakuyugo", name("核融合党", "核分裂党"), "核融", "#FFB300", "小規模政党", List.of("小党")));
        list.add(party("Yamato", name("新党やまと", "旧党やまと"), "やま", "#8D6E63", "小規模政党", List.of("小党")));
        list.add(party("Saigo", name("西郷党", "東郷党"), "西郷", "#90A4AE", "小規模政党", List.of("小党")));

        return list;
    }

    private List<PartyJson> proportionalParties() {
        return List.of(
                party("JCP", name("日本共産党", "日本資本党"), "共産", "#E53935", "格差是正と平和を掲げる政党", List.of("左派", "平和")),
                party("Ishin", name("日本維新の会", "日本自信の会"), "維新", "#009688", "改革と行政効率を掲げる政党", List.of("改革")),
                party("Rengou", name("無所属連合", "Null連合"), "無連", "#90A4AE", "特定政党に属さない連合", List.of("無所属")),
                party("Hoshuto", name("日本保守党", "日本社会党"), "保守", "#5D4037", "伝統と安全保障を重視する", List.of("保守")),

                party("CDP", name("立憲民主党", "立憲眠主党"), "立憲", "#1976D2", "生活と権利を重視する政党", List.of("リベラル")),
                party("Sansei", name("参政党", "賛成党"), "参政", "#6D4C41", "参加型の政治を掲げる政党", List.of("保守", "参加")),
                party("DPP", name("国民民主党", "国民眠主党"), "国民", "#43A047", "現実的な改革と成長を掲げる", List.of("中道", "改革")),
                party("Team", name("チームみらい", "チームかこ"), "みらい", "#00ACC1", "未来技術と改革を掲げる", List.of("テック")),

                party("Seishin", name("日本誠真会", "日本精神会"), "誠真", "#00897B", "誠実さを掲げる小規模政党", List.of("中道")),
                party("Shamin", name("社会民主党", "社会眠主党"), "社民", "#7CB342", "人権・福祉を重視する", List.of("人権", "福祉")),
                party("Reiwa", name("れいわ新選組", "しょうわ新選組"), "れいわ", "#8E24AA", "積極財政と生活支援を掲げる", List.of("福祉")),
                party("Kaikaku", name("日本改革党", "日本かくかく党"), "改革", "#F4511E", "制度改革を掲げる小規模政党", List.of("改革")),

                party("LDP", name("自由民主党", "自由眠主党"), "自民", "#D81B60", "経済と安定を掲げる大きな政党", List.of("保守")),
                party("Saisei", name("再生の道", "調整の道"), "再生", "#3949AB", "再建と改革を掲げる", List.of("改革")),
                party("KOMEI", name("公明党", "共鳴党"), "公明", "#FFA000", "福祉・教育を重視する政党", List.of("中道", "福祉")),
                party("N党", name("ＮＨＫ党", "ＮＰＯ党"), "N党", "#546E7A", "既存制度改革を掲げる", List.of("改革")));
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
        all.addAll(judgeCandidates()); // J01, J02

        // 過去（都知事 2024）
        all.addAll(tokyoGov2024Candidates()); // TG24_*

        // 未来（想像）
        all.addAll(machidaMayor2026Candidates()); // MY26_*
        all.addAll(machidaCouncil2026Candidates()); // MC26_*
        return all;
    }

    // ===== 現在：参院 東京選挙区（本物データ32）=====
    private List<CandidateJson> tokyoDistrictCandidates32() {
        return List.of(
                // 苗字だけ or 名前だけ、どちらか片方だけいじる

                // 01: 名前だけ（よし子→よしこ）
                cand("TD01", person("吉良 よし子", "吉良 よいこ"), 51, "JCP", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 02: 名前だけ（ジョージ→ジョウジ）
                cand("TD02", person("山本 ジョージ", "山本 ジョウジ"), 60, "Reiwa", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 03: 名前だけ（アイ→あい）
                cand("TD03", person("吉永 アイ", "吉永 コイ"), 35, null, "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 04: 名前だけ（けんしん→けんじん）※母音・リズム近い
                cand("TD04", person("土居 けんしん", "土居 けんじん"), 33, null, "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 05: 名前だけ（ひろあき→ひろあけ）※軽い母音ズラし
                cand("TD05", person("藤川 ひろあき", "藤川 ひろあけ"), 44, "Kaikaku", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 06: 苗字だけ（西→東）※あなたの例に合わせる
                cand("TD06", person("西 みゆか", "東 みゆか"), 55, "Shamin", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 07: 名前だけ（英二→英司）※読み近い
                cand("TD07", person("小坂 英二", "小坂 英司"), 50, "Hoshuto", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 08: 名前だけ（さや→さよ）※母音近い
                cand("TD08", person("さや", "さよ"), 34, "Sansei", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 09: 名前だけ（侑也→佑也）※読み同じ/字面だけ
                cand("TD09", person("みねしま 侑也", "みねしま 佑也"), 29, "Team", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 10: 名前だけ（敬三→敬之）※読み近い
                cand("TD10", person("たけみ 敬三", "たけみ 敬之"), 72, "LDP", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 11: 名前だけ（まさよし→まさよき）※母音ほぼ同じ
                cand("TD11", person("おくむら まさよし", "おくむら まさよき"), 43, "CDP", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 12: 名前だけ（まゆ→まよ）
                cand("TD12", person("牛田 まゆ", "牛田 まよ"), 39, "DPP", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 13: 名前だけ（ともひろ→ともひこ）
                cand("TD13", person("酒井 ともひろ", "酒井 ともひこ"), 48, "Minna", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 14: 名前だけ（康廣→康博）※読み近い
                cand("TD14", person("福村 康廣", "福村 康博"), 67, "SekaiHeiwa", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 15: 名前だけ（康文→康史）
                cand("TD15", person("桑島 康文", "桑島 康史"), 58, "Kakuyugo", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 16: 名前だけ（りく→りゅく）だと変なので（りく→りゅう）で母音維持
                cand("TD16", person("渋谷 りく", "渋谷 りゅう"), 26, "Yamato", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 17: 名前だけ（よしひろ→よしひこ）
                cand("TD17", person("奥村 よしひろ", "奥村 よしひこ"), 47, "DPP", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 18: 名前だけ（あや→あゆ）
                cand("TD18", person("吉田 あや", "吉田 あゆ"), 36, "Saisei", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 19: 名前だけ（大地→大知）※読み近い
                cand("TD19", person("鈴木 大地", "鈴木 大知"), 58, "LDP", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 20: 名前だけ（あやか→あゆか）
                cand("TD20", person("塩村 あやか", "塩村 あゆか"), 45, "CDP", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 21: 名前だけ（恵理→恵里）※読み同じ/字面だけ
                cand("TD21", person("よしざわ 恵理", "よしざわ 恵里"), 40, null, "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 22: 名前だけ（たけしま→たけじま）※母音維持
                cand("TD22", person("市川 たけしま", "市川 たけじま"), 46, "Kaikaku", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 23: 名前だけ（ゆうだい→ゆうたい）※母音近い
                cand("TD23", person("川村 ゆうだい", "川村 ゆうたい"), 39, "KOMEI", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 24: 名前だけ（駿→駿一）※読み近い
                cand("TD24", person("おときた 駿", "おときた 駿一"), 41, "Ishin", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 25: 名前だけ（雨龍→雨竜）※読み同じ/字面だけ
                cand("TD25", person("平野 雨龍", "平野 雨竜"), 30, null, "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 26: 名前だけ（しおり→しおる）※母音近い
                cand("TD26", person("山尾 しおり", "山尾 しおる"), 50, null, "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 27: 名前だけ（ひとし→ひとき）※母音近い
                cand("TD27", person("ちば ひとし", "ちば ひとき"), 52, "Seishin", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 28: 名前だけ（昇→登）※読み近い
                cand("TD28", person("増田 昇", "増田 登"), 64, null, "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 29: 名前だけ（健太郎→健太朗）※読み同じ/字面だけ
                cand("TD29", person("つじ 健太郎", "つじ 健太朗"), 49, "Rengou", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 30: 名前だけ（幹夫→幹雄）※母音近い
                cand("TD30", person("早川 幹夫", "早川 幹雄"), 61, "Saigo", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 31: あなたの例に合わせる（石丸→右丸）苗字だけ改変
                cand("TD31", person("石丸 幸人", "右丸 幸人"), 42, "N党", "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")),

                // 32: 名前だけ（健司→健次）※読み近い
                cand("TD32", person("高橋 健司", "高橋 健次"), 57, null, "候補者", "東京都選挙区 候補者。", List.of("東京都選挙区")));
    }

    // ===== 比例（政党＝候補）=====
    // ※ parties() じゃなく proportionalParties() を使う！
    private List<CandidateJson> proportionalPartyProxyCandidates(String prefix) {
        var out = new ArrayList<CandidateJson>();
        int i = 0;

        for (var p : proportionalParties()) {
            String key = prefix + p.partyKey();
            int age = 40 + (i % 25); // 40..64（固定的に埋める）
            out.add(new CandidateJson(
                    key,
                    "【比例】" + p.name(),
                    age,
                    p.partyKey(),
                    "比例代表（党）",
                    "比例の投票先（党）を表すダミー候補です。",
                    List.of("比例", "党"),
                    null,
                    imageUrlFor(key)));
            i++;
        }
        return out;
    }

    // candidateKey一覧も比例16党に固定
    private List<String> proportionalCandidateKeys(String prefix) {
        var keys = new ArrayList<String>();
        for (var p : proportionalParties())
            keys.add(prefix + p.partyKey());
        return keys;
    }

    // ===== 国民審査（裁判官2名：本物データ）=====
    private List<CandidateJson> judgeCandidates() {
        return List.of(
                // 名前だけ：順一→順一郎
                cand("J01", person("高須 順一", "高須 順一郎"), 58, null,
                        "最高裁裁判官", "審査対象の裁判官です。", List.of("国民審査")),
                // 名前だけ：眞已→眞己（読み近い）
                cand("J02", person("沖野 眞已", "沖野 眞己"), 61, null,
                        "最高裁裁判官", "審査対象の裁判官です。", List.of("国民審査")));
    }

    // ===== 過去：都知事 2024（代表 + 抜粋 + ダミー）=====
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

    private static final int DEFAULT_AGE = 50;

    private CandidateJson cand(
            String key, String name, Integer age, String partyKey,
            String title, String bio, List<String> policies) {

        String imageUrl = imageUrlFor(key);
        int safeAge = (age == null) ? DEFAULT_AGE : age;

        return new CandidateJson(key, name, safeAge, partyKey, title, bio, policies, null, imageUrl);
    }

    // ---------------------------
    // Elections
    // ---------------------------
    public List<ElectionJson> elections() {
        return List.of(
                // ===== 過去：都知事 2024（終了）=====
                new ElectionJson(
                        EID_TOKYO_GOV_2024,
                        "東京都知事選挙 2024",
                        "都知事を選ぶ選挙",
                        "DEMO", // ✅ ElectionType enum 未定義回避（TOKYO_GOV を使わない）
                        new ElectionJson.DistrictJson(PREF_TOKYO, CITY_ALL_TOKYO, "東京都"),
                        "SINGLE_CHOICE",
                        PAST_START,
                        PAST_END,
                        tokyoGov2024CandidateKeys()),

                // ===== 現在：参院（2026/02/08〜03/08相当）=====
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
                        List.of("J01", "J02")),

                // ===== 未来：町田 市長 2026（想像）=====
                new ElectionJson(
                        EID_MACHIDA_MAYOR_2026,
                        "町田市長選挙 2026",
                        "町田市長を選ぶ選挙。",
                        "DEMO",
                        new ElectionJson.DistrictJson(PREF_TOKYO, CITY_MACHIDA, "町田市"),
                        "SINGLE_CHOICE",
                        FUT_2026_LOCAL_START,
                        FUT_2026_LOCAL_END,
                        List.of("MY26_01", "MY26_02", "MY26_03")),

                // ===== 未来：町田 市議 2026（想像）=====
                new ElectionJson(
                        EID_MACHIDA_COUNCIL_2026,
                        "町田市議会議員選挙 2026",
                        "町田市議を選ぶ選挙。",
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
                citizenMachida(uuid("11111111-1111-1111-1111-111111111111"), "加藤", "匠",
                        LocalDate.of(2004, 7, 24), "町田市1-2-3", "M", "1234"),

                // 町田・成人（OK）
                citizenMachida(uuid("22222222-2222-2222-2222-222222222222"), "橋本", "哲志",
                        LocalDate.of(2003, 10, 10), "町田市2-3-4", "M", "2345"),

                // 韓国・成人（NG）
                citizenMachida(uuid("33333333-3333-3333-3333-333333333333"), "イェダム", "ユ",
                        LocalDate.of(2004, 5, 21), "韓国市1-2-3", "M", "3456"),

                // 市外・成人（NG）
                citizenOtherCity(uuid("44444444-4444-4444-4444-444444444444"), "榎丸", "澄香",
                        LocalDate.of(1990, 3, 3), "立川市1-1-1", "F", "4567"),

                // 町田・未成年（NG）
                citizenMachida(uuid("55555555-5555-5555-5555-555555555555"), "山内", "政和",
                        LocalDate.of(2014, 9, 5), "町田市3-4-5", "M", "5678"),

                // 市外・未成年（NG）
                citizenOtherCity(uuid("66666666-6666-6666-6666-666666666666"), "生田目", "凌輔",
                        LocalDate.of(2022, 12, 25), "大和市1-1-1", "M", "6789"));

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
                new CommitteeJson("admin", "Passw0rd!!", Role.COMMITTEE, PREF_TOKYO, CITY_MACHIDA, true, false));
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
                new VoteJson(EID_TOKYO_DISTRICT, uuid("44444444-4444-4444-4444-444444444444"), 22, -480) // TD23
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

    // ---------------------------
    // Judge Review Votes（国民審査）
    // ---------------------------
    public List<JudgeReviewVoteJson> judgeReviewVoteCasts() {
        return List.of(
                // voter.ok が国民審査を投票済みにする例（J01 OK / J02 NO）
                new JudgeReviewVoteJson(
                        EID_JUDGE_REVIEW,
                        uuid("11111111-1111-1111-1111-111111111111"),
                        -180, // 3分前
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
