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

export function IdentityLinkPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;
    const { setAccessToken } = useAuth();

    const [method, setMethod] = useState<IdentityMethod>("MANUAL");

    const backTo = normalizeFrom(state.from ?? "/me");
    const from = loc.pathname + loc.search;

    const to = useMemo(() => {
        const fallback = "/me/elections";
        return state.from && state.from !== loc.pathname
            ? state.from
            : fallback;
    }, [state.from, loc.pathname]);

    const canWebNfc = hasWebNfc();

    const onLinked = (_accessToken: string) => {
        nav(to, { replace: true });
    };

    // ★ DEV用：スタブログイン
    const loginAs = async (p: { email: string; password: string }) => {
        const token = await login(p.email, p.password);
        await setAccessToken(token.accessToken);
        nav(to, { replace: true });
    };

    const isDev = import.meta.env?.DEV;

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
                        ・認証後は元の画面へ戻ります
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

                        {state.from && (
                            <span
                                style={{
                                    marginLeft: "auto",
                                    fontSize: 12,
                                    opacity: 0.7,
                                }}
                            >
                                認証後は元の画面へ戻ります
                            </span>
                        )}
                    </div>
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
                    }}
                >
                    {method === "MANUAL" ? (
                        <IdentityManualForm onLinked={onLinked} />
                    ) : canWebNfc ? (
                        <IdentityNfcScanner onLinked={onLinked} />
                    ) : (
                        <IdentityNfcKeyboardReader onLinked={onLinked} />
                    )}
                </div>

                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
                    ※ うまくいかない場合は「手入力」をお試しください
                </div>
            </Card>

            {/* ===== DEV ONLY ===== */}
            {isDev && (
                <Card>
                    <details>
                        <summary style={{ cursor: "pointer" }}>
                            DEV tools
                        </summary>

                        <div
                            style={{ display: "grid", gap: 12, marginTop: 10 }}
                        >
                            <div>
                                <div
                                    style={{ fontWeight: 900, marginBottom: 6 }}
                                >
                                    DEV: スタブログイン
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    {Object.values(demoPersonas.voter).map(
                                        (p) => (
                                            <button
                                                key={p.key}
                                                type="button"
                                                onClick={() => loginAs(p)}
                                                style={{
                                                    fontSize: 12,
                                                    padding: "6px 10px",
                                                }}
                                                title={p.description}
                                            >
                                                {p.label}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>

                            <DevDebug
                                value={{
                                    method,
                                    state,
                                    backTo,
                                    to,
                                    canWebNfc,
                                }}
                            />
                        </div>
                    </details>
                </Card>
            )}
        </Page>
    );
}
