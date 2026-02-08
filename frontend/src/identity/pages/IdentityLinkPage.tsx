// frontend/src/identity/pages/IdentityLinkPage.tsx
import { useMemo, useState } from "react";
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
import { demoPersonas } from "../../demo/personas";
import { login } from "../../user/api/userAuthApi";
import { useAuth } from "../../user/UserAuthContext";

type LocationState = { from?: string };

function hasWebNfc() {
    return typeof (window as any).NDEFReader !== "undefined";
}

function isPinValid(pin: string) {
    return /^\d{4}$/.test(pin);
}

export function IdentityLinkPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const { setAccessToken } = useAuth();

    const [method, setMethod] = useState<IdentityMethod>("MANUAL");
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    // ✅ 追加：PIN
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

    // 既存の linkIdentity 完了時
    const onLinkedUser = (_accessToken: string) => {
        nav(toUser, { replace: true });
    };

    // DEV: スタブログイン
    const loginAs = async (p: { email: string; password: string }) => {
        setBusy(true);
        setErr(null);
        try {
            const token = await login(p.email, p.password);
            await setAccessToken(token.accessToken);
            nav(toUser, { replace: true });
        } catch (e: any) {
            setErr(
                e?.response?.data?.message ??
                    e?.message ??
                    "ログインに失敗しました",
            );
        } finally {
            setBusy(false);
        }
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

            {/* ✅ 追加：PIN入力カード */}
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
                            }}
                        />

                        <div style={{ marginTop: 12 }}>
                            <div style={{ fontWeight: 900, marginBottom: 6 }}>
                                DEV: スタブログイン
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    flexWrap: "wrap",
                                }}
                            >
                                {Object.values(demoPersonas.voter).map((p) => (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() => loginAs(p)}
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
