// frontend/src/identity/pages/IdentityLinkPage.tsx
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    IdentityMethodTabs,
    type IdentityMethod,
} from "../components/IdentityMethodTabs";
import { IdentityManualForm } from "../components/IdentityManualForm";
import { IdentityNfcStub } from "../components/IdentityNfcStub";

type LocationState = { from?: string };

export function IdentityLinkPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const [method, setMethod] = useState<IdentityMethod>("MANUAL");

    const fallback = "/me/elections";
    const to = useMemo(() => {
        // 自分自身に戻るのは避ける
        return state.from && state.from !== loc.pathname
            ? state.from
            : fallback;
    }, [state.from, loc.pathname]);

    const onLinked = () => {
        // ここは「直で戻る」でも「pendingへ」でもOK
        // NFC実装後もこの挙動を維持できる
        nav(to, { replace: true });
        // もし「審査中」を挟みたいなら：
        // nav("/identity/pending", { replace: true, state: { from: to } });
    };

    const isDev = import.meta.env?.DEV;

    return (
        <div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 560 }}>
            <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <h2 style={{ margin: 0 }}>本人認証</h2>
                <span style={{ marginLeft: "auto" }}>
                    <Link to="/me">My Pageへ</Link>
                </span>
            </header>

            <IdentityMethodTabs
                value={method}
                onChange={setMethod}
                nfcEnabled={false}
            />

            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 12,
                }}
            >
                {method === "MANUAL" ? (
                    <IdentityManualForm onLinked={onLinked} />
                ) : (
                    <IdentityNfcStub />
                )}

                {state.from && (
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                        認証後は元の画面へ戻ります
                    </div>
                )}
            </div>

            {isDev && (
                <details>
                    <summary>Debug</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                        {JSON.stringify({ method, state }, null, 2)}
                    </pre>
                </details>
            )}
        </div>
    );
}
