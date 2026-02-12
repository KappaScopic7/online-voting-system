// frontend/src/identity/pages/IdentityPendingPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
    Link,
    useLocation,
    useNavigate,
    useSearchParams,
} from "react-router-dom";
import { useAuth } from "../../user/UserAuthContext";
import { getVotePairing } from "../api/identity";
import { Card, Page, DevDebug } from "../../shared/ui/page";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { QRCodeSVG } from "qrcode.react";

type LocationState = {
    from?: string;
};

export function IdentityPendingPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;
    const [sp] = useSearchParams();

    // ----------------------------
    // モード判定
    // ----------------------------
    const mode = sp.get("mode") ?? "";
    const isVotePairing = mode === "votePairing";

    const pairId = sp.get("pairId") ?? "";
    const electionId = sp.get("electionId") ?? "";
    const returnTo = sp.get("returnTo") ?? "";
    const deepLink = sp.get("deepLink") ?? "";
    const backToQ = sp.get("backTo") ?? "";

    const backTo = useMemo(() => {
        const fallback = "/elections";
        return normalizeFrom(backToQ || state.from || fallback);
    }, [backToQ, state.from]);

    // ============================================================
    // 🟦 VOTE PAIRING MODE（PC待機画面 + QR表示）
    // ============================================================
    const [pairMsg, setPairMsg] = useState<string | null>(null);
    const [pairErr, setPairErr] = useState<string | null>(null);
    const [pairStatus, setPairStatus] = useState<string>("PENDING");

    useEffect(() => {
        if (!isVotePairing) return;
        if (!pairId) {
            setPairErr("pairId がありません。最初からやり直してください。");
            return;
        }

        let cancelled = false;

        const tick = async () => {
            try {
                const r = await getVotePairing(pairId);
                if (cancelled) return;

                setPairStatus(r.status ?? "PENDING");

                if (r.status === "COMPLETED" && r.ticket) {
                    const q = new URLSearchParams();
                    q.set("ticket", String(r.ticket));
                    if (electionId) q.set("electionId", electionId);
                    if (returnTo) q.set("returnTo", returnTo);

                    // ✅ PCでcallbackへ
                    window.location.href = `/auth/public/callback?${q.toString()}`;
                    return;
                }

                if (r.status === "EXPIRED") {
                    setPairErr("期限切れです。もう一度やり直してください。");
                    return;
                }

                setPairMsg(
                    "スマホでQRを読み取り、アプリでPIN入力 → カードをスキャンしてください。",
                );
            } catch {
                if (!cancelled) {
                    setPairMsg("接続中...（スマホで認証を続けてください）");
                }
            }
        };

        tick();
        const id = window.setInterval(tick, 1200);

        return () => {
            cancelled = true;
            window.clearInterval(id);
        };
    }, [isVotePairing, pairId, electionId, returnTo]);

    // ============================================================
    // 🟨 LEGACY LINK MODE（従来審査中）
    // ============================================================
    const { me, refreshMe } = useAuth();
    const fromLegacy = state.from ?? "/me";

    const [msg, setMsg] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const check = async () => {
        setMsg(null);
        setIsRefreshing(true);
        try {
            await refreshMe();
        } catch (e: any) {
            setMsg(e?.response?.data?.message ?? "Failed to refresh");
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (isVotePairing) return;
        check();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVotePairing]);

    useEffect(() => {
        if (isVotePairing) return;
        if (!me) return;

        if (me.identityStatus === "LINKED") {
            nav(fromLegacy ?? "/me", { replace: true });
            return;
        }

        if (me.identityStatus !== "PENDING") {
            nav("/me/identity", {
                replace: true,
                state: { from: fromLegacy },
            });
        }
    }, [isVotePairing, me, nav, fromLegacy]);

    const isDev = import.meta.env?.DEV;

    // ============================================================
    // 🟦 RENDER: VOTE PAIRING
    // ============================================================
    if (isVotePairing) {
        return (
            <Page
                title={
                    <h1 style={{ margin: 0, fontSize: 20 }}>
                        スマホでNFC認証（PC待機中）
                    </h1>
                }
                actions={
                    <div style={{ display: "flex", gap: 12 }}>
                        <Link to={backTo}>← 戻る</Link>
                        <Link to="/elections">選挙一覧 →</Link>
                    </div>
                }
                maxWidth={680}
            >
                {pairErr && (
                    <Card role="alert">
                        <div style={{ fontWeight: 900, marginBottom: 6 }}>
                            エラー
                        </div>
                        <div>{pairErr}</div>
                    </Card>
                )}

                <Card>
                    <div
                        style={{
                            display: "grid",
                            gap: 20,
                            justifyItems: "center",
                            textAlign: "center",
                        }}
                    >
                        <div style={{ fontWeight: 900 }}>
                            スマホでこのQRを読み取ってください
                        </div>

                        {deepLink && (
                            <div
                                style={{
                                    padding: 20,
                                    background: "white",
                                    borderRadius: 16,
                                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                                }}
                            >
                                <QRCodeSVG
                                    value={deepLink}
                                    size={260}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    level="M"
                                    includeMargin
                                />
                            </div>
                        )}

                        <div
                            style={{
                                fontSize: 14,
                                opacity: 0.8,
                                lineHeight: 1.6,
                            }}
                        >
                            1. スマホでQRを読み取る
                            <br />
                            2. アプリでPIN入力
                            <br />
                            3. NFCカードをスキャン
                            <br />
                            4. 認証完了でこの画面が自動で進みます
                        </div>

                        <div style={{ fontSize: 12, opacity: 0.6 }}>
                            status: <b>{pairStatus}</b>
                        </div>

                        {pairMsg && (
                            <div
                                style={{
                                    fontSize: 13,
                                    opacity: 0.8,
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {pairMsg}
                            </div>
                        )}
                    </div>
                </Card>

                {isDev && (
                    <DevDebug
                        value={{
                            mode,
                            pairId,
                            electionId,
                            returnTo,
                            deepLink,
                            pairStatus,
                        }}
                    />
                )}
            </Page>
        );
    }

    // ============================================================
    // 🟨 RENDER: LEGACY LINK
    // ============================================================
    return (
        <div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 640 }}>
            <h2>本人認証（審査中）</h2>

            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 12,
                }}
            >
                <p>
                    現在、本人認証は <b>審査中</b> です。
                </p>

                <button onClick={check} disabled={isRefreshing}>
                    {isRefreshing ? "更新中..." : "状態を更新"}
                </button>

                {msg && <div style={{ marginTop: 8 }}>{msg}</div>}
            </div>

            <Link to="/me/identity" state={{ from: fromLegacy }}>
                本人認証をやり直す
            </Link>

            {isDev && <DevDebug value={{ me, state, msg }} />}
        </div>
    );
}
