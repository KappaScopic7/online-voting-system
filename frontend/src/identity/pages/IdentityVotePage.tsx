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

export function IdentityVotePage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state as LocationState) ?? null;
    const [sp] = useSearchParams();

    const webNfc = useMemo(() => hasWebNfc(), []);

    const electionId = sp.get("electionId") ?? "";
    const returnToQ = sp.get("returnTo") ?? "";
    const backFromState = state?.from ?? "";
    const backTo = useMemo(() => {
        const fallback = electionId
            ? `/elections/${encodeURIComponent(electionId)}`
            : "/elections";
        // state.from を「戻る先」として使う（無ければ fallback）
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

    const [pin, setPin] = useState("");
    const [manualPayload, setManualPayload] = useState("");
    const [status, setStatus] = useState<
        "IDLE" | "SCANNING" | "PROCESSING" | "SUCCESS" | "ERROR"
    >("IDLE");
    const [msg, setMsg] = useState(
        "PIN を入力して、NFCまたは手入力で本人認証してください",
    );
    const [err, setErr] = useState<string | null>(null);

    const [method, setMethod] = useState<"NFC" | "MANUAL">(
        webNfc ? "NFC" : "MANUAL",
    );

    // ✅ NDEFReader が無い端末なら NFC タブを強制的に MANUAL に寄せる
    useEffect(() => {
        if (!webNfc && method === "NFC") setMethod("MANUAL");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [webNfc]);

    const canSubmit = isPinValid(pin);

    // ✅ onreading の二重発火/多重送信ガード
    const busyRef = useRef(false);

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

            const res = await issueVoteToken({
                electionId,
                payload,
                pin,
            });

            publicToken.set(res.voteToken);

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
        if (!webNfc) {
            setErr(
                "この端末/ブラウザは Web NFC に対応していません（手入力を使ってください）",
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

    const submitManual = async () => {
        if (!canSubmit) {
            setErr("先にPIN（4桁）を入力してください");
            return;
        }
        const v = manualPayload.trim();
        if (!looksLikeUuid(v)) {
            setErr("payload（UUID）を正しく入力してください");
            return;
        }
        await doIssue(v);
    };

    const isDev = import.meta.env?.DEV;
    // ✅ DEV: personas
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
        setManualPayload(cid);
        // PINも一緒に入れたいなら（好みで）
        // setPin("1234");
    };

    const scanDisabled =
        !webNfc ||
        !canSubmit ||
        status === "SCANNING" ||
        status === "PROCESSING" ||
        status === "SUCCESS";

    const manualDisabled =
        status === "PROCESSING" || status === "SUCCESS" || !canSubmit;

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
                    {/* <Link to={returnTo}>← 戻る</Link> */}
                    <Link to={backTo}>← 戻る</Link>
                    <Link to="/elections" state={{ from: self }}>
                        選挙一覧 →
                    </Link>
                </div>
            }
            maxWidth={680}
        >
            {err && (
                <Card role="alert">
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>
                        エラー
                    </div>
                    <div style={{ marginBottom: 10 }}>{err}</div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <button type="button" onClick={() => setErr(null)}>
                            閉じる
                        </button>
                        {/* <Link to={returnTo}>戻る</Link> */}
                        <Link to={backTo}>← 戻る</Link>
                    </div>
                </Card>
            )}

            <Card>
                <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ fontWeight: 900 }}>PIN（4桁）を入力</div>

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
                        style={{ padding: 10, fontSize: 16, width: 180 }}
                        disabled={
                            status === "PROCESSING" || status === "SUCCESS"
                        }
                    />

                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                        ※ PINはカード所持者確認のために必要です
                    </div>

                    {!canSubmit && pin.length > 0 && (
                        <div style={{ fontSize: 12, color: "crimson" }}>
                            PINは4桁の数字で入力してください
                        </div>
                    )}
                </div>
            </Card>

            <Card>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                        type="button"
                        onClick={() => setMethod("NFC")}
                        disabled={!webNfc}
                        style={{ fontWeight: method === "NFC" ? 900 : 600 }}
                    >
                        NFC
                    </button>
                    <button
                        type="button"
                        onClick={() => setMethod("MANUAL")}
                        style={{ fontWeight: method === "MANUAL" ? 900 : 600 }}
                    >
                        手入力
                    </button>

                    <span
                        style={{
                            marginLeft: "auto",
                            fontSize: 12,
                            opacity: 0.75,
                        }}
                    >
                        端末: {webNfc ? "Web NFC 対応" : "Web NFC 非対応"}
                    </span>
                </div>

                <div
                    style={{
                        marginTop: 12,
                        border: "1px solid #eee",
                        borderRadius: 12,
                        padding: 12,
                    }}
                >
                    {method === "NFC" ? (
                        <div style={{ display: "grid", gap: 12 }}>
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
                                style={{ padding: 12, fontSize: 16 }}
                            >
                                {status === "IDLE"
                                    ? "スキャン開始"
                                    : status === "ERROR"
                                      ? "再試行する"
                                      : "スキャン中..."}
                            </button>

                            {!webNfc && (
                                <div style={{ fontSize: 12, opacity: 0.75 }}>
                                    この端末は Web NFC
                                    に対応していません（手入力を使用してください）
                                </div>
                            )}
                            {webNfc && !canSubmit && (
                                <div style={{ fontSize: 12, opacity: 0.75 }}>
                                    ※ 先に PIN（4桁）を入力してください
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: 10 }}>
                            <div style={{ fontWeight: 800 }}>
                                payload（citizenId UUID）
                            </div>
                            <input
                                placeholder="550e8400-e29b-41d4-a716-446655440000"
                                value={manualPayload}
                                onChange={(e) =>
                                    setManualPayload(e.target.value)
                                }
                                style={{ padding: 10, fontSize: 14 }}
                                disabled={
                                    status === "PROCESSING" ||
                                    status === "SUCCESS"
                                }
                            />
                            <button
                                onClick={submitManual}
                                disabled={manualDisabled}
                            >
                                {status === "PROCESSING"
                                    ? "送信中..."
                                    : "本人認証して投票へ進む"}
                            </button>

                            {!canSubmit && (
                                <div style={{ fontSize: 12, opacity: 0.75 }}>
                                    ※ 先に PIN（4桁）を入力してください
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
                    ※ うまくいかない場合は「手入力」をお試しください
                </div>
            </Card>

            {isDev && (
                <Card>
                    <details>
                        <summary style={{ cursor: "pointer" }}>
                            DEV tools
                        </summary>

                        <div
                            style={{ display: "grid", gap: 10, marginTop: 10 }}
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
                                        setErr(null);
                                        setMethod("MANUAL");
                                        setManualPayload(
                                            "550e8400-e29b-41d4-a716-446655440000",
                                        );
                                    }}
                                    disabled={
                                        status === "PROCESSING" ||
                                        status === "SUCCESS"
                                    }
                                    style={{
                                        fontSize: 12,
                                        padding: "6px 10px",
                                    }}
                                    title="固定UUIDを入れる"
                                >
                                    payload(例)セット
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
                                    title="本人認証トークンを消してテストをやり直す"
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

                                <button
                                    type="button"
                                    onClick={async () => {
                                        // ワンクリ送信（手入力）
                                        setMethod("MANUAL");
                                        await submitManual();
                                    }}
                                    disabled={manualDisabled}
                                    style={{
                                        fontSize: 12,
                                        padding: "6px 10px",
                                    }}
                                    title="MANUAL の内容で doIssue まで実行"
                                >
                                    手入力で送信
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

                            {!devLoading &&
                                !devErr &&
                                devPersonas.length === 0 && (
                                    <div
                                        style={{ fontSize: 12, opacity: 0.75 }}
                                    >
                                        DEVユーザーが0件です（/api/demo/personas
                                        を確認）
                                    </div>
                                )}
                        </div>
                    </details>
                    <DevDebug
                        value={{
                            electionId,
                            returnTo,
                            method,
                            pin: pin ? "(present)" : null,
                            status,
                            webNfc,
                            hasStoredPublicToken: !!publicToken.get(),
                            state,
                            loc,
                        }}
                    />
                </Card>
            )}
        </Page>
    );
}
