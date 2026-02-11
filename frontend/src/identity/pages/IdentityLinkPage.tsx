// frontend/src/identity/pages/IdentityLinkPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    IdentityMethodTabs,
    type IdentityMethod,
} from "../components/IdentityMethodTabs";
import { IdentityManualForm } from "../components/IdentityManualForm";
import { IdentityNfcScanner } from "../components/IdentityNfcScanner";
import { IdentityNfcKeyboardReader } from "../components/IdentityNfcKeyboardReader";
import { Card, Page, DevDebug } from "../../shared/ui/page";
import { normalizeFrom } from "../../shared/normalizeFrom";
import {
    fetchDemoPersonas,
    type DemoPersonaDto,
} from "../../demo/api/demoPersonas";

type LocationState = { from?: string };

function hasWebNfc() {
    return typeof (window as any).NDEFReader !== "undefined";
}
function isPinValid(pin: string) {
    return /^\d{4}$/.test(pin);
}

function buildAndroidLinkDeepLink(params: { returnTo: string }) {
    const q = new URLSearchParams();
    q.set("returnTo", params.returnTo);
    return `ovs://nfc-link?${q.toString()}`;
}

function openAndroidLinkApp(returnTo: string) {
    window.location.href = buildAndroidLinkDeepLink({ returnTo });
}

type Step = "PIN" | "METHOD";

export function IdentityLinkPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const canWebNfc = hasWebNfc();
    const isDev = import.meta.env?.DEV;

    const [step, setStep] = useState<Step>("PIN");

    // PIN
    const [pin, setPin] = useState("");
    const pinOk = isPinValid(pin);

    const [method, setMethod] = useState<IdentityMethod>(() =>
        canWebNfc ? "NFC" : "MANUAL",
    );

    const [err, setErr] = useState<string | null>(null);
    const [busy] = useState(false);

    const backTo = normalizeFrom(state.from ?? "/me");
    const from = loc.pathname + loc.search;

    // 認証後は state.from か /me/elections に戻す
    const toUser = useMemo(() => {
        const fallback = "/me/elections";
        return state.from && state.from !== loc.pathname
            ? state.from
            : fallback;
    }, [state.from, loc.pathname]);

    // linkIdentity 完了時
    const onLinkedUser = (_accessToken: string) => {
        nav(toUser, { replace: true });
    };

    // ----------------------------
    // DEV: dynamic personas
    // ----------------------------
    const [devPersonas, setDevPersonas] = useState<DemoPersonaDto[]>([]);
    const [devLoading, setDevLoading] = useState(false);
    const [devErr, setDevErr] = useState<string | null>(null);
    const [devCitizenId, setDevCitizenId] = useState("");

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
        setErr(null);
        setDevCitizenId((p.citizenId ?? "").trim());
        setMethod("MANUAL");
        setStep("METHOD"); // それっぽく、入力まで進める
    };

    // ----------------------------
    // Step controls
    // ----------------------------
    const goNext = () => {
        if (!pinOk) return;
        setErr(null);
        setStep("METHOD");
    };
    const goBackToPin = () => {
        setErr(null);
        setStep("PIN");
    };

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>本人認証</h1>}
            actions={
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link to={backTo}>← 戻る</Link>
                    <Link to="/me" state={{ from }}>
                        My Page →
                    </Link>
                </div>
            }
            maxWidth={680}
        >
            {/* エラー */}
            {err && (
                <Card role="alert">
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>
                        エラー
                    </div>
                    <div style={{ marginBottom: 10 }}>{err}</div>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <button
                            type="button"
                            onClick={() => setErr(null)}
                            disabled={busy}
                        >
                            閉じる
                        </button>
                        <Link to={backTo}>戻る</Link>
                    </div>
                </Card>
            )}

            {/* 共通ヘッダ（それっぽく段階表示） */}
            <Card>
                <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ fontWeight: 900 }}>
                        {step === "PIN"
                            ? "STEP 1 / 2：PIN（4桁）を入力"
                            : "STEP 2 / 2：認証方法を選択"}
                    </div>

                    <div
                        style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.7 }}
                    >
                        ・NFC または 手入力で本人認証できます
                        <br />
                        ・認証後は元の画面へ戻ります
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
                            {canWebNfc ? "Web NFC 対応" : "Web NFC 非対応"}
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
                                disabled={busy}
                            />

                            {!pinOk && pin.length > 0 && (
                                <div style={{ fontSize: 12, color: "crimson" }}>
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
                                    disabled={!pinOk || busy}
                                    style={{ fontWeight: 700 }}
                                >
                                    次へ →
                                </button>

                                <span style={{ fontSize: 12, opacity: 0.75 }}>
                                    ※ PINはカード所持者確認のために必要です
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* ✅ Android導線はPIN入力前に出す（このページのPINは不要で起動できる） */}
                    <Card>
                        <div style={{ display: "grid", gap: 10 }}>
                            <div style={{ fontWeight: 900 }}>
                                別端末（Android）でNFC認証
                            </div>

                            <div
                                style={{
                                    fontSize: 13,
                                    opacity: 0.85,
                                    lineHeight: 1.7,
                                }}
                            >
                                ・このページのPIN入力は不要です（Android側で入力します）
                                <br />
                                ・認証後、この画面に戻って紐付けを完了します
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    flexWrap: "wrap",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        // ✅ このページに戻ってくればOK（state.from 維持したいなら from でもOK）
                                        openAndroidLinkApp(from);
                                    }}
                                    disabled={busy}
                                    style={{
                                        padding: "10px 14px",
                                        fontWeight: 800,
                                    }}
                                >
                                    Androidアプリを開く →
                                </button>

                                <span
                                    style={{
                                        fontSize: 12,
                                        opacity: 0.75,
                                        alignSelf: "center",
                                    }}
                                >
                                    ※ アプリ未インストールの場合は反応しません
                                </span>
                            </div>

                            {import.meta.env?.DEV && (
                                <DevDebug
                                    value={{
                                        androidDeepLink:
                                            buildAndroidLinkDeepLink({
                                                returnTo: from,
                                            }),
                                    }}
                                />
                            )}
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

                            <span style={{ fontSize: 12, opacity: 0.75 }}>
                                PIN: <b>••••</b>（入力済み）
                            </span>

                            <span style={{ marginLeft: "auto" }} />
                        </div>

                        {!canWebNfc && (
                            <div style={{ fontSize: 12, opacity: 0.75 }}>
                                この端末は Web NFC 非対応です。「NFC」を選ぶと、
                                NFCリーダの入力で認証できます。
                            </div>
                        )}

                        <IdentityMethodTabs
                            value={method}
                            onChange={setMethod}
                            allowManual={!canWebNfc}
                        />

                        {/* ✅ Androidカードは STEP2 から削除（PIN前に出す方針） */}

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
                                    pin={pin}
                                    pinRequired
                                    onLinked={onLinkedUser}
                                    onError={setErr}
                                    devCitizenId={devCitizenId}
                                />
                            ) : canWebNfc ? (
                                <IdentityNfcScanner
                                    pin={pin}
                                    pinRequired
                                    mode="IDENTITY_LINK"
                                    onLinked={onLinkedUser}
                                    onError={setErr}
                                />
                            ) : (
                                <IdentityNfcKeyboardReader
                                    pin={pin}
                                    pinRequired
                                    onLinked={onLinkedUser}
                                    onError={setErr}
                                />
                            )}
                        </div>

                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                            ※ うまくいかない場合は「手入力」をお試しください
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

                        <DevDebug
                            value={{
                                step,
                                method,
                                err,
                                busy,
                                pin: pin ? "(present)" : null,
                                pinOk,
                                backTo,
                                toUser,
                                from,
                                state,
                                canWebNfc,
                                devLoading,
                                devErr,
                                devPersonasCount: devPersonas.length,
                                devCitizenId: devCitizenId ? "(present)" : null,
                            }}
                        />

                        <div style={{ marginTop: 12 }}>
                            <div style={{ fontWeight: 900, marginBottom: 6 }}>
                                DEV: citizenId 自動セット（ログインしない）
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    flexWrap: "wrap",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={reloadDevPersonas}
                                    disabled={busy || devLoading}
                                    style={{
                                        fontSize: 12,
                                        padding: "6px 10px",
                                    }}
                                >
                                    {devLoading ? "読み込み中..." : "再読込"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDevCitizenId("")}
                                    disabled={busy}
                                    style={{
                                        fontSize: 12,
                                        padding: "6px 10px",
                                    }}
                                >
                                    クリア
                                </button>
                            </div>

                            {devErr && (
                                <div
                                    style={{
                                        marginTop: 8,
                                        color: "crimson",
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
                                    marginTop: 8,
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
                                        disabled={busy}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </details>
                </Card>
            )}

            <DevDebug
                value={{
                    step,
                    method,
                    err,
                    busy,
                    pinOk,
                    backTo,
                    toUser,
                    from,
                    state,
                }}
            />
        </Page>
    );
}
