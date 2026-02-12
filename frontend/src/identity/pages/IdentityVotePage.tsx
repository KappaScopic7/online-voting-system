// frontend/src/identity/pages/IdentityVotePage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Link,
    useLocation,
    useNavigate,
    useSearchParams,
} from "react-router-dom";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { publicToken } from "../../shared/tokenStorage";
import { issueVoteToken } from "../../public/api/voteToken";
import {
    fetchDemoPersonas,
    type DemoPersonaDto,
} from "../../demo/api/demoPersonas";
import { IdentityNfcKeyboardReader } from "../components/IdentityNfcKeyboardReader";
import {
    IdentityMethodTabs,
    type IdentityMethod,
} from "../components/IdentityMethodTabs";
import { IdentityManualForm } from "../components/IdentityManualForm";
import { createVotePairing } from "../api/identity";

type LocationState = { from?: string } | null;

function looksLikeUuid(v: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        String(v ?? "").trim(),
    );
}

function extractUuidFromNdef(event: any): string | null {
    const msg = event?.message;
    const records = msg?.records;
    if (!records || !Array.isArray(records)) return null;

    for (const rec of records) {
        try {
            if (rec.recordType === "text") {
                const encoding = rec.encoding ?? "utf-8";
                const text = rec.data
                    ? new TextDecoder(encoding).decode(rec.data)
                    : "";
                const v = String(text).trim();
                if (looksLikeUuid(v)) return v;
            }
            if (rec.recordType === "url") {
                const url = rec.data
                    ? new TextDecoder("utf-8").decode(rec.data)
                    : "";
                const m = String(url).match(
                    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
                );
                if (m?.[0]) return m[0];
            }
        } catch {
            // ignore
        }
    }
    return null;
}

function hasWebNfc() {
    return typeof (window as any).NDEFReader !== "undefined";
}

function isPinValid(pin: string) {
    return /^\d{4}$/.test(pin);
}

// ✅ PC側：pairId ありの deep link（Flutterの votePairing に入る）
function buildAndroidPairDeepLink(params: {
    electionId: string;
    pairId: string;
    returnTo: string;
}) {
    const q = new URLSearchParams();
    q.set("electionId", params.electionId);
    q.set("pairId", params.pairId);
    q.set("returnTo", params.returnTo);
    return `ovs://nfc-auth?${q.toString()}`;
}

function isMobileBrowser() {
    const ua = navigator.userAgent ?? "";
    return /Android|iPhone|iPad|iPod/i.test(ua);
}

type Step = "PIN" | "METHOD";

export function IdentityVotePage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state as LocationState) ?? null;
    const [sp] = useSearchParams();

    const canWebNfc = useMemo(() => hasWebNfc(), []);
    const isMobile = useMemo(() => isMobileBrowser(), []);
    const isPc = !isMobile;

    const electionId = sp.get("electionId") ?? "";
    const returnToQ = sp.get("returnTo") ?? "";
    const backFromState = state?.from ?? "";

    const backTo = useMemo(() => {
        const fallback = electionId
            ? `/elections/${encodeURIComponent(electionId)}`
            : "/elections";
        return normalizeFrom(backFromState || fallback);
    }, [backFromState, electionId]);

    // ✅ 戻り先：優先順位 returnTo(query) > state.from > fallback
    const returnTo = useMemo(() => {
        const fallback = electionId
            ? `/voting/entry?electionId=${encodeURIComponent(
                  electionId,
              )}&session=public`
            : "/elections";
        const raw = returnToQ || backFromState || fallback;
        return normalizeFrom(raw);
    }, [returnToQ, backFromState, electionId]);

    const self = loc.pathname + loc.search;

    // ----------------------------
    // PC: Pairing Flow
    // ----------------------------
    const [pcBusy, setPcBusy] = useState(false);
    const [pcErr, setPcErr] = useState<string | null>(null);

    const startPcPairing = async () => {
        if (!electionId) {
            setPcErr("electionId がありません（投票入口から開いてください）");
            return;
        }
        setPcErr(null);
        setPcBusy(true);
        try {
            const created = await createVotePairing({ electionId });
            const pairId = (created?.pairId ?? "").trim();
            if (!pairId) throw new Error("pairId missing");

            const deepLink = buildAndroidPairDeepLink({
                electionId,
                pairId,
                returnTo,
            });

            const q = new URLSearchParams();
            q.set("mode", "votePairing");
            q.set("pairId", pairId);
            q.set("electionId", electionId);
            q.set("returnTo", returnTo);
            q.set("deepLink", deepLink);
            q.set("backTo", backTo);

            nav(`/identity/pending?${q.toString()}`, { replace: false });
        } catch (e: any) {
            setPcErr(
                e?.response?.data?.message ??
                    e?.message ??
                    "ペアリング開始に失敗しました",
            );
        } finally {
            setPcBusy(false);
        }
    };

    // ----------------------------
    // Mobile: existing flow (keep)
    // ----------------------------
    const [step, setStep] = useState<Step>("PIN");

    const [pin, setPin] = useState("");
    const pinOk = isPinValid(pin);

    const [devCitizenId, setDevCitizenId] = useState("");

    const [status, setStatus] = useState<
        "IDLE" | "SCANNING" | "PROCESSING" | "SUCCESS" | "ERROR"
    >("IDLE");
    const [msg, setMsg] = useState(
        "PIN を入力して、NFCまたは手入力で本人認証してください",
    );
    const [err, setErr] = useState<string | null>(null);

    const [method, setMethod] = useState<IdentityMethod>(() =>
        canWebNfc ? "NFC" : "MANUAL",
    );

    const canSubmit = pinOk;

    // ✅ WebNFC の onreading 二重発火/多重送信ガード
    const busyRef = useRef(false);

    const resetRuntimeState = () => {
        setStatus("IDLE");
        setMsg("PIN を入力して、NFCまたは手入力で本人認証してください");
        setErr(null);
        busyRef.current = false;
    };

    const doIssue = async (payloadRaw: string) => {
        if (busyRef.current) return;
        busyRef.current = true;

        try {
            if (!electionId) {
                setErr("electionId がありません（投票入口から開いてください）");
                setStatus("ERROR");
                setMsg("エラー");
                return;
            }
            if (!isPinValid(pin)) {
                setErr("PINは4桁の数字で入力してください");
                setStatus("ERROR");
                setMsg("エラー");
                return;
            }

            const payload = String(payloadRaw ?? "").trim();
            if (!looksLikeUuid(payload)) {
                setErr("payload（UUID）が不正です");
                setStatus("ERROR");
                setMsg("エラー");
                return;
            }

            setErr(null);
            setStatus("PROCESSING");
            setMsg("送信中...");

            const res = await issueVoteToken({ electionId, payload, pin });

            const token = (res?.voteToken ?? "").trim();
            if (!token) throw new Error("voteToken missing");

            publicToken.set(token);

            setStatus("SUCCESS");
            setMsg("本人認証に成功しました。投票画面へ移動します…");

            window.setTimeout(() => {
                nav(returnTo, { replace: true });
            }, 300);
        } catch (e: any) {
            setStatus("ERROR");
            setErr(e?.response?.data?.message ?? "本人認証に失敗しました");
            setMsg("エラー");
        } finally {
            busyRef.current = false;
        }
    };

    const startScan = async () => {
        if (!canWebNfc) {
            setErr(
                "この端末/ブラウザは Web NFC に対応していません（NFCリーダー入力 or 手入力を使ってください）",
            );
            return;
        }
        if (!canSubmit) {
            setErr("先にPIN（4桁）を入力してください");
            return;
        }

        setErr(null);
        setStatus("SCANNING");
        setMsg("カードをスマートフォンの背面に近づけてください...");

        try {
            // @ts-ignore
            const ndef = new NDEFReader();
            await ndef.scan();

            ndef.onreading = async (event: any) => {
                if (busyRef.current) return;

                const uuid = extractUuidFromNdef(event);
                if (!uuid) {
                    setStatus("ERROR");
                    setErr(
                        "タグから citizenId(UUID) を読み取れませんでした。TextレコードにUUIDが入っているか確認してください。",
                    );
                    setMsg("エラー");
                    return;
                }
                if (!looksLikeUuid(uuid)) {
                    setStatus("ERROR");
                    setErr("読み取り結果がUUID形式ではありません。");
                    setMsg("エラー");
                    return;
                }

                setStatus("PROCESSING");
                setMsg(`読み取り成功: ${uuid}\nサーバーに送信中...`);
                await doIssue(uuid);
            };

            ndef.onreadingerror = () => {
                setStatus("ERROR");
                setErr(
                    "読み取りエラーが発生しました。カードをしっかり密着させてください。",
                );
                setMsg("エラー");
            };
        } catch {
            setStatus("ERROR");
            setErr("NFCの起動に失敗しました。権限を許可してください。");
            setMsg("エラー");
        }
    };

    // ----------------------------
    // Step controls（Mobile用）
    // ----------------------------
    const goNext = () => {
        if (!pinOk) return;
        setErr(null);
        setStep("METHOD");
        setStatus("IDLE");
        setMsg("PIN を入力して、NFCまたは手入力で本人認証してください");
    };
    const goBackToPin = () => {
        setErr(null);
        setStep("PIN");
        resetRuntimeState();
    };

    const scanDisabled =
        !canWebNfc ||
        !canSubmit ||
        status === "SCANNING" ||
        status === "PROCESSING" ||
        status === "SUCCESS";

    const isDev = import.meta.env?.DEV;

    // ----------------------------
    // DEV: personas（Mobile用）
    // ----------------------------
    const [devPersonas, setDevPersonas] = useState<DemoPersonaDto[]>([]);
    const [devLoading, setDevLoading] = useState(false);
    const [devErr, setDevErr] = useState<string | null>(null);

    const reloadDevPersonas = async () => {
        if (!isDev) return;
        try {
            setDevErr(null);
            setDevLoading(true);
            const list = await fetchDemoPersonas();
            setDevPersonas(Array.isArray(list) ? list : []);
        } catch (e: any) {
            const m =
                e?.response?.data?.message ??
                e?.message ??
                "DEV personas の取得に失敗しました";
            setDevErr(m);
            setDevPersonas([]);
        } finally {
            setDevLoading(false);
        }
    };

    useEffect(() => {
        reloadDevPersonas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDev]);

    const fillDev = (p: DemoPersonaDto) => {
        const cid = (p.citizenId ?? "").trim();
        if (!cid) return;
        setErr(null);
        setMethod("MANUAL");
        setDevCitizenId(cid);
        setStep("METHOD");
    };

    return (
        <Page
            title={
                <h1 style={{ margin: 0, fontSize: 20 }}>本人認証（投票用）</h1>
            }
            actions={
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <Link to={backTo}>← 戻る</Link>
                    <Link to="/elections" state={{ from: self }}>
                        選挙一覧 →
                    </Link>
                </div>
            }
            maxWidth={680}
        >
            {/* =========================
             * PC: Pairing UI（標準）
             * ========================= */}
            {isPc ? (
                <div style={{ display: "grid", gap: 12 }}>
                    {pcErr && (
                        <Card role="alert">
                            <div style={{ fontWeight: 800, marginBottom: 6 }}>
                                エラー
                            </div>
                            <div style={{ marginBottom: 10 }}>{pcErr}</div>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    flexWrap: "wrap",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setPcErr(null)}
                                >
                                    閉じる
                                </button>
                                <Link to={backTo}>← 戻る</Link>
                            </div>
                        </Card>
                    )}

                    <Card>
                        <div style={{ display: "grid", gap: 10 }}>
                            <div style={{ fontWeight: 900 }}>
                                PCで投票する場合：スマホアプリでNFC認証します
                            </div>

                            <div
                                style={{
                                    fontSize: 13,
                                    opacity: 0.85,
                                    lineHeight: 1.7,
                                }}
                            >
                                1) 「スマホで認証を開始」を押す
                                <br />
                                2) 表示されたリンク/QRをスマホで開いてアプリ起動
                                <br />
                                3) アプリでPIN入力 → カードをスキャン
                                <br />
                                4)
                                認証が完了すると、このPC画面が自動で投票へ進みます
                            </div>

                            <button
                                type="button"
                                onClick={startPcPairing}
                                disabled={pcBusy}
                                style={{
                                    padding: "12px 14px",
                                    fontWeight: 900,
                                    fontSize: 16,
                                }}
                            >
                                {pcBusy ? "準備中..." : "スマホで認証を開始 →"}
                            </button>

                            <div style={{ fontSize: 12, opacity: 0.75 }}>
                                ※
                                PCではブラウザ完結させません（スマホアプリ認証が必須）
                            </div>
                        </div>
                    </Card>

                    {isDev && (
                        <DevDebug
                            value={{
                                mode: "PC_PAIRING",
                                electionId,
                                returnTo,
                                backTo,
                                ua: navigator.userAgent,
                            }}
                        />
                    )}
                </div>
            ) : (
                /* =========================
                 * Mobile: existing UI（従来）
                 * ========================= */
                <>
                    {/* エラー */}
                    {err && (
                        <Card role="alert">
                            <div style={{ fontWeight: 800, marginBottom: 6 }}>
                                エラー
                            </div>
                            <div style={{ marginBottom: 10 }}>{err}</div>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    flexWrap: "wrap",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setErr(null)}
                                >
                                    閉じる
                                </button>
                                <Link to={backTo}>← 戻る</Link>
                            </div>
                        </Card>
                    )}

                    {/* 共通ヘッダ */}
                    <Card>
                        <div style={{ display: "grid", gap: 10 }}>
                            <div style={{ fontWeight: 900 }}>
                                {step === "PIN"
                                    ? "STEP 1 / 2：PIN（4桁）を入力"
                                    : "STEP 2 / 2：認証方法を選択"}
                            </div>

                            <div
                                style={{
                                    fontSize: 13,
                                    opacity: 0.85,
                                    lineHeight: 1.7,
                                }}
                            >
                                ・NFC または 手入力で本人認証できます
                                <br />
                                ・認証後は投票画面へ戻ります
                                <br />
                                ・PIN（4桁）はカード所持者確認のために必要です
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 12,
                                        opacity: 0.75,
                                        padding: "4px 10px",
                                        borderRadius: 999,
                                        border: "1px solid #eee",
                                        background: "#fafafa",
                                    }}
                                >
                                    端末:{" "}
                                    {canWebNfc
                                        ? "Web NFC 対応"
                                        : "Web NFC 非対応"}
                                </span>

                                <span
                                    style={{
                                        fontSize: 12,
                                        opacity: 0.75,
                                        padding: "4px 10px",
                                        borderRadius: 999,
                                        border: "1px solid #eee",
                                        background: "#fafafa",
                                    }}
                                >
                                    認証方法:{" "}
                                    {canWebNfc
                                        ? "NFC（かざす） / 手入力"
                                        : "NFC（リーダ） / 手入力"}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* STEP 1: PIN */}
                    {step === "PIN" && (
                        <div style={{ display: "grid", gap: 12 }}>
                            <Card>
                                <div style={{ display: "grid", gap: 10 }}>
                                    <div style={{ fontWeight: 900 }}>
                                        PIN（4桁）を入力してください
                                    </div>

                                    <input
                                        inputMode="numeric"
                                        pattern="\d{4}"
                                        maxLength={4}
                                        placeholder="例: 1234"
                                        value={pin}
                                        onChange={(e) =>
                                            setPin(
                                                e.target.value
                                                    .replace(/[^\d]/g, "")
                                                    .slice(0, 4),
                                            )
                                        }
                                        style={{
                                            padding: 10,
                                            fontSize: 16,
                                            width: 180,
                                        }}
                                        disabled={
                                            status === "PROCESSING" ||
                                            status === "SUCCESS"
                                        }
                                    />

                                    {!pinOk && pin.length > 0 && (
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: "crimson",
                                            }}
                                        >
                                            PINは4桁の数字で入力してください
                                        </div>
                                    )}

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 12,
                                            flexWrap: "wrap",
                                            alignItems: "center",
                                            marginTop: 4,
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={goNext}
                                            disabled={!pinOk}
                                            style={{ fontWeight: 700 }}
                                        >
                                            次へ →
                                        </button>

                                        <span
                                            style={{
                                                fontSize: 12,
                                                opacity: 0.75,
                                            }}
                                        >
                                            ※
                                            PINはカード所持者確認のために必要です
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* STEP 2: METHOD */}
                    {step === "METHOD" && (
                        <Card>
                            <div style={{ display: "grid", gap: 10 }}>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 12,
                                        flexWrap: "wrap",
                                        alignItems: "center",
                                    }}
                                >
                                    <button type="button" onClick={goBackToPin}>
                                        ← PINを修正
                                    </button>

                                    <span
                                        style={{
                                            fontSize: 12,
                                            opacity: 0.75,
                                        }}
                                    >
                                        PIN: <b>••••</b>（入力済み）
                                    </span>

                                    <span style={{ marginLeft: "auto" }} />
                                </div>

                                <IdentityMethodTabs
                                    value={method}
                                    onChange={setMethod}
                                    allowManual={!canWebNfc}
                                />

                                <div
                                    style={{
                                        marginTop: 12,
                                        border: "1px solid #eee",
                                        borderRadius: 12,
                                        padding: 12,
                                    }}
                                >
                                    {method === "MANUAL" ? (
                                        <IdentityManualForm
                                            mode="VOTE_TOKEN_ISSUE"
                                            electionId={electionId}
                                            pin={pin}
                                            pinRequired
                                            devCitizenId={devCitizenId}
                                            onIssued={() =>
                                                nav(returnTo, {
                                                    replace: true,
                                                })
                                            }
                                            onError={setErr}
                                        />
                                    ) : canWebNfc ? (
                                        <div
                                            style={{
                                                display: "grid",
                                                gap: 12,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: 120,
                                                    background:
                                                        status === "SCANNING"
                                                            ? "#e6f7ff"
                                                            : "#f5f5f5",
                                                    borderRadius: 8,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    flexDirection: "column",
                                                    border: "2px dashed #ccc",
                                                    padding: 12,
                                                }}
                                            >
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        whiteSpace: "pre-wrap",
                                                    }}
                                                >
                                                    {msg}
                                                </p>
                                            </div>

                                            <button
                                                onClick={startScan}
                                                disabled={scanDisabled}
                                                style={{
                                                    padding: 12,
                                                    fontSize: 16,
                                                }}
                                            >
                                                {status === "IDLE"
                                                    ? "スキャン開始"
                                                    : status === "ERROR"
                                                      ? "再試行する"
                                                      : "スキャン中..."}
                                            </button>

                                            {!canSubmit && (
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        opacity: 0.75,
                                                    }}
                                                >
                                                    ※ 先に
                                                    PIN（4桁）を入力してください
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <IdentityNfcKeyboardReader
                                            mode="VOTE_TOKEN_ISSUE"
                                            electionId={electionId}
                                            pin={pin}
                                            pinRequired
                                            onIssued={() =>
                                                nav(returnTo, {
                                                    replace: true,
                                                })
                                            }
                                            onError={setErr}
                                        />
                                    )}
                                </div>

                                <div
                                    style={{
                                        fontSize: 12,
                                        opacity: 0.7,
                                        marginTop: 8,
                                    }}
                                >
                                    ※
                                    うまくいかない場合は「手入力」をお試しください
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* DEV tools */}
                    {isDev && (
                        <Card>
                            <details>
                                <summary style={{ cursor: "pointer" }}>
                                    DEV tools
                                </summary>

                                <div
                                    style={{
                                        display: "grid",
                                        gap: 10,
                                        marginTop: 10,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setPin("1234")}
                                            disabled={
                                                status === "PROCESSING" ||
                                                status === "SUCCESS"
                                            }
                                            style={{
                                                fontSize: 12,
                                                padding: "6px 10px",
                                            }}
                                        >
                                            PIN=1234
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                publicToken.clear();
                                                setErr(null);
                                            }}
                                            style={{
                                                fontSize: 12,
                                                padding: "6px 10px",
                                            }}
                                        >
                                            publicTokenクリア
                                        </button>

                                        <button
                                            type="button"
                                            onClick={reloadDevPersonas}
                                            disabled={devLoading}
                                            style={{
                                                fontSize: 12,
                                                padding: "6px 10px",
                                            }}
                                        >
                                            {devLoading
                                                ? "読み込み中..."
                                                : "personas再読込"}
                                        </button>
                                    </div>

                                    {devErr && (
                                        <div
                                            style={{
                                                color: "crimson",
                                                fontSize: 12,
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {devErr}
                                        </div>
                                    )}

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        {devPersonas.map((p) => (
                                            <button
                                                key={p.key}
                                                type="button"
                                                onClick={() => fillDev(p)}
                                                style={{
                                                    fontSize: 12,
                                                    padding: "6px 10px",
                                                }}
                                                title={p.description}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </details>

                            <DevDebug
                                value={{
                                    electionId,
                                    returnTo,
                                    backTo,
                                    step,
                                    method,
                                    pin: pin ? "(present)" : null,
                                    status,
                                    canWebNfc,
                                    hasStoredPublicToken: !!publicToken.get(),
                                    state,
                                    loc,
                                }}
                            />
                        </Card>
                    )}

                    <DevDebug
                        value={{
                            electionId,
                            returnTo,
                            backTo,
                            step,
                            method,
                            pinOk,
                            status,
                            canWebNfc,
                            isMobile,
                            isPc,
                        }}
                    />
                </>
            )}
        </Page>
    );
}
