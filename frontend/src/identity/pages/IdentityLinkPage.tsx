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

// function looksLikeUuid(v: string) {
//     return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
//         String(v ?? "").trim(),
//     );
// }

export function IdentityLinkPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const [method, setMethod] = useState<IdentityMethod>("MANUAL");
    const [err, setErr] = useState<string | null>(null);
    const [
        busy,
        // setBusy
    ] = useState(false);

    // ✅ PIN
    const [pin, setPin] = useState("");
    const pinOk = isPinValid(pin);

    const backTo = normalizeFrom(state.from ?? "/me");
    const from = loc.pathname + loc.search;

    // 認証後は state.from か /me/elections に戻す
    const toUser = useMemo(() => {
        const fallback = "/me/elections";
        return state.from && state.from !== loc.pathname
            ? state.from
            : fallback;
    }, [state.from, loc.pathname]);

    const canWebNfc = hasWebNfc();
    const isDev = import.meta.env?.DEV;

    // ✅ DEV: dynamic personas
    const [devPersonas, setDevPersonas] = useState<DemoPersonaDto[]>([]);
    const [devLoading, setDevLoading] = useState(false);
    const [devErr, setDevErr] = useState<string | null>(null);

    // ✅ DEV: 手入力フォームに流し込む citizenId
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

    // linkIdentity 完了時（ここでアカウント切替しない）
    const onLinkedUser = (_accessToken: string) => {
        nav(toUser, { replace: true });
    };

    // ✅ DEVボタン：フォームにセットするだけ（ログインしない）
    const fillDev = (p: DemoPersonaDto) => {
        setErr(null);
        setMethod("MANUAL"); // 手入力タブに寄せておくと便利
        setDevCitizenId((p.citizenId ?? "").trim());
        // PINも一緒に入れたいならここ（必要なければ消してOK）
        // setPin("1234");
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
            <Card>
                <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ fontWeight: 900 }}>
                        認証方法を選択してください
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
                    </div>
                </div>
            </Card>

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

            {/* PIN入力 */}
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
                        disabled={busy}
                    />

                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                        ※ PINはカード所持者確認のために必要です
                    </div>

                    {!pinOk && pin.length > 0 && (
                        <div style={{ fontSize: 12, color: "crimson" }}>
                            PINは4桁の数字で入力してください
                        </div>
                    )}
                </div>
            </Card>

            <Card>
                <IdentityMethodTabs value={method} onChange={setMethod} />

                <div
                    style={{
                        marginTop: 12,
                        border: "1px solid #eee",
                        borderRadius: 12,
                        padding: 12,
                        opacity: pinOk ? 1 : 0.75,
                    }}
                >
                    {method === "MANUAL" ? (
                        <IdentityManualForm
                            pin={pin}
                            pinRequired
                            onLinked={onLinkedUser}
                            onError={setErr}
                            // ✅ DEVで埋めた citizenId を ManualForm に渡す
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

                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
                    ※ うまくいかない場合は「手入力」をお試しください
                </div>

                {!pinOk && (
                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
                        ※ 先に PIN（4桁）を入力してください
                    </div>
                )}
            </Card>

            {isDev && (
                <Card>
                    <details>
                        <summary style={{ cursor: "pointer" }}>
                            DEV tools
                        </summary>

                        <DevDebug
                            value={{
                                method,
                                err,
                                busy,
                                pin: pin ? "(present)" : null,
                                pinOk,
                                backTo,
                                toUser,
                                from,
                                state,
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
                                    title="手入力に戻したい時用"
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

                            {!devLoading &&
                                !devErr &&
                                devPersonas.length === 0 && (
                                    <div
                                        style={{
                                            marginTop: 8,
                                            opacity: 0.8,
                                            fontSize: 12,
                                        }}
                                    >
                                        DEVユーザーが0件です（/api/demo/personas
                                        を確認）
                                    </div>
                                )}

                            {!devLoading &&
                                !devErr &&
                                devPersonas.length > 0 && (
                                    <div
                                        style={{
                                            marginTop: 8,
                                            opacity: 0.8,
                                            fontSize: 12,
                                        }}
                                    >
                                        ※ citizenId が
                                        null/空のユーザーは押しても反映されません
                                    </div>
                                )}
                        </div>
                    </details>
                </Card>
            )}

            <DevDebug
                value={{
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
