import { useEffect, useMemo, useState } from "react";
import {
    Link,
    useNavigate,
    useSearchParams,
    useLocation,
} from "react-router-dom";
import { Card, Page, DevDebug } from "../../shared/ui/page";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../../user/UserAuthContext";
import { getVotePairing } from "../api/identity";
import { useIdentityNav } from "../hooks/useIdentityNav";
import { useIdentityDevice } from "../hooks/useIdentityDevice";

/**
 * mode:
 * - votePairing: PC投票のためのペアリング待機（pairIdをポーリング）
 * - linkPending: PC本人認証のためのスマホ誘導待機（me を refresh して LINKED を待つ）
 */
export function IdentityPendingPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const [sp] = useSearchParams();
    const { isAndroid } = useIdentityDevice();

    const mode = sp.get("mode") ?? "";
    const isVotePairing = mode === "votePairing";
    const isLinkPending = mode === "linkPending";

    const pairId = sp.get("pairId") ?? "";

    // ★ここを少し修正：確実に文字列として取得
    const electionIdRaw = sp.get("electionId");
    const electionId = electionIdRaw ? electionIdRaw.trim() : "";

    const returnTo = sp.get("returnTo") ?? "";
    const deepLink = sp.get("deepLink") ?? "";
    const backToQ = sp.get("backTo") ?? "";

    // Link pending 用
    const fromLegacy = useMemo(
        () => (loc.state as any)?.from ?? "/me",
        [loc.state],
    );

    const { backTo } = useIdentityNav({
        fallbackBackTo: "/elections",
        fallbackReturnTo: "/elections",
        returnToQ: backToQ,
    });

    const isDev = import.meta.env?.DEV;

    // ============================================================
    // 共通：QR表示 + 説明UI
    // ============================================================
    const title = isVotePairing
        ? "スマホでNFC認証（PC待機中）"
        : isLinkPending
          ? "スマホでNFC認証（本人認証 / PC待機中）"
          : "待機中";

    const stepsText = isVotePairing
        ? [
              "1. スマホでQRを読み取る",
              "2. アプリでPIN入力",
              "3. NFCカードをスキャン",
              "4. 認証完了でこの画面が自動で進みます",
          ].join("\n")
        : [
              "1. スマホでQRを読み取る",
              "2. アプリでPIN入力",
              "3. NFCカードをタッチ",
              "4. 認証完了後、この画面が自動で戻ります",
          ].join("\n");

    useEffect(() => {
        if (!isAndroid) return;
        if (!deepLink) return;
        if (!isVotePairing && !isLinkPending) return;

        const key = `ovs.pending.autolaunch.${mode}.${pairId ?? ""}.${deepLink}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
        window.location.href = deepLink;
    }, [isAndroid, deepLink, mode, isVotePairing, isLinkPending, pairId]);

    // ============================================================
    // 🟦 VOTE PAIRING MODE（PC待機画面 + pairId ポーリング）
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

                    // ★ここも修正：electionIdがあれば確実にセット
                    if (electionId) {
                        q.set("electionId", electionId);
                    }
                    if (returnTo) q.set("returnTo", returnTo);

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
                if (!cancelled)
                    setPairMsg("接続中...（スマホで認証を続けてください）");
            }
        };

        tick();
        const id = window.setInterval(tick, 1200);
        return () => {
            cancelled = true;
            window.clearInterval(id);
        };
    }, [isVotePairing, pairId, electionId, returnTo]);

    const { me, refreshMe } = useAuth();
    const [linkMsg, setLinkMsg] = useState<string | null>(null);
    const [linkErr, setLinkErr] = useState<string | null>(null);

    useEffect(() => {
        if (!isLinkPending) return;
        let cancelled = false;

        const tick = async () => {
            try {
                await refreshMe();
            } catch (e: any) {
                if (!cancelled) {
                    setLinkErr(
                        e?.response?.data?.message ?? "Failed to refresh",
                    );
                    setLinkMsg("接続中...（スマホで認証を続けてください）");
                }
            }
        };

        tick();
        const id = window.setInterval(tick, 1200);

        return () => {
            cancelled = true;
            window.clearInterval(id);
        };
    }, [isLinkPending, refreshMe]);

    useEffect(() => {
        if (!isLinkPending) return;

        if (!me) {
            setLinkMsg("認証結果を確認中...（ログインしている必要があります）");
            return;
        }
        if (me.identityStatus === "LINKED") {
            nav(fromLegacy ?? "/me", { replace: true });
            return;
        }

        // 2. それ以外（PENDINGや、まだ申請前の状態）なら画面に留まる
        //    以前のコードはここで勝手に nav() していたため一瞬で消えていました
        if (me.identityStatus === "PENDING") {
            setLinkMsg(
                "スマホで認証を完了してください（完了すると自動で戻ります）",
            );
        } else {
            // まだPENDINGになっていない（QR読み取り待ち）状態
            setLinkMsg("スマホでQRを読み取ってください");
        }
    }, [isLinkPending, me, nav, fromLegacy]);

    if (!isVotePairing && !isLinkPending) {
        return (
            <Page
                title={<h1 style={{ margin: 0, fontSize: 20 }}>待機</h1>}
                actions={
                    <div style={{ display: "flex", gap: 12 }}>
                        <Link to={backTo}>← 戻る</Link>
                        <Link to="/elections">選挙一覧 →</Link>
                    </div>
                }
                maxWidth={680}
            >
                <Card role="alert">
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>
                        エラー
                    </div>
                    <div>mode が不正です。最初からやり直してください。</div>
                </Card>

                {isDev && (
                    <DevDebug
                        value={{ mode, sp: Object.fromEntries(sp.entries()) }}
                    />
                )}
            </Page>
        );
    }

    const statusLabel = isVotePairing
        ? `status: ${pairStatus}`
        : me?.identityStatus
          ? `status: ${me.identityStatus}`
          : "status: ...";
    const mainMsg = isVotePairing ? pairMsg : linkMsg;
    const mainErr = isVotePairing ? pairErr : linkErr;

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>{title}</h1>}
            actions={
                <div style={{ display: "flex", gap: 12 }}>
                    <Link to={backTo}>← 戻る</Link>
                    <Link to="/elections">選挙一覧 →</Link>
                </div>
            }
            maxWidth={680}
        >
            {mainErr && (
                <Card role="alert">
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>
                        エラー
                    </div>
                    <div>{mainErr}</div>
                </Card>
            )}

            <Card>
                <div
                    style={{
                        display: "grid",
                        gap: 18,
                        justifyItems: "center",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontWeight: 900 }}>
                        {isAndroid
                            ? "Androidの場合：アプリを開きます（開かない場合はQRを使ってください）"
                            : "スマホでこのQRを読み取ってください"}
                    </div>

                    {deepLink ? (
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
                    ) : (
                        <div style={{ fontSize: 13, opacity: 0.8 }}>
                            deepLink がありません（前画面の指定ミスです）
                        </div>
                    )}

                    {deepLink && (
                        <button
                            type="button"
                            onClick={() => {
                                window.location.href = deepLink;
                            }}
                            style={{
                                padding: "10px 14px",
                                fontWeight: 900,
                            }}
                        >
                            アプリを開く →
                        </button>
                    )}

                    <div
                        style={{
                            fontSize: 14,
                            opacity: 0.8,
                            lineHeight: 1.6,
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {stepsText}
                    </div>

                    <div style={{ fontSize: 12, opacity: 0.6 }}>
                        <b>{statusLabel}</b>
                    </div>

                    {mainMsg && (
                        <div
                            style={{
                                fontSize: 13,
                                opacity: 0.8,
                                whiteSpace: "pre-wrap",
                            }}
                        >
                            {mainMsg}
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
                        me,
                        fromLegacy,
                        ua: navigator.userAgent,
                    }}
                />
            )}
        </Page>
    );
}
