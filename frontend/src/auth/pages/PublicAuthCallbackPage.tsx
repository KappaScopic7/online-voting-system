import { useState } from "react"; // useEffect, useRef を削除
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, Page, DevDebug } from "../../shared/ui/page";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { publicToken } from "../../shared/tokenStorage";
import { exchangeNfcTicket } from "../api/publicAuth";

export function PublicAuthCallbackPage() {
    const nav = useNavigate();
    const [sp] = useSearchParams();

    const ticket = (sp.get("ticket") ?? "").trim();
    const electionIdQ = (sp.get("electionId") ?? "").trim();
    const returnToQ = (sp.get("returnTo") ?? "").trim();

    const electionId = electionIdQ || "00000000-0000-0000-0000-000000000000";

    const [status, setStatus] = useState<
        "IDLE" | "PROCESSING" | "ERROR" | "DONE"
    >("IDLE");
    const [err, setErr] = useState<string | null>(null);

    const handleExchange = async () => {
        if (!ticket) {
            setErr("チケットがありません");
            return;
        }

        try {
            setErr(null);
            setStatus("PROCESSING");

            const res = await exchangeNfcTicket({ ticket, electionId });

            const accessToken = (res?.accessToken ?? "").trim();
            if (!accessToken) throw new Error("accessToken が返りませんでした");

            publicToken.set(accessToken);

            setStatus("DONE");
            window.setTimeout(() => {
                // 戻り先へ移動
                const fallback = electionIdQ
                    ? `/voting/entry?electionId=${encodeURIComponent(electionIdQ)}&session=public`
                    : "/elections";
                const target = normalizeFrom(returnToQ || fallback);
                nav(target, { replace: true });
            }, 500);
        } catch (e: any) {
            setStatus("ERROR");
            setErr(e?.response?.data?.message ?? e?.message ?? "exchange 失敗");
        }
    };

    return (
        <Page
            title={
                <h1 style={{ margin: 0, fontSize: 20 }}>
                    認証処理（デバッグ）
                </h1>
            }
            maxWidth={680}
        >
            <Card>
                <div style={{ textAlign: "center", padding: 20 }}>
                    <div
                        style={{
                            marginBottom: 20,
                            wordBreak: "break-all",
                            fontSize: 12,
                            color: "#666",
                        }}
                    >
                        Ticket: {ticket.slice(0, 10)}...
                        <br />
                        ElectionId: {electionId}
                    </div>

                    {status === "IDLE" && (
                        <button
                            onClick={handleExchange}
                            style={{
                                padding: "12px 24px",
                                fontSize: "16px",
                                fontWeight: "bold",
                                background: "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                            }}
                        >
                            認証を実行する（1回だけ）
                        </button>
                    )}

                    {status === "PROCESSING" && (
                        <div style={{ fontWeight: 800 }}>通信中...</div>
                    )}

                    {status === "DONE" && (
                        <div style={{ fontWeight: 800, color: "green" }}>
                            認証成功！移動します...
                        </div>
                    )}

                    {status === "ERROR" && (
                        <div>
                            <div
                                style={{
                                    fontWeight: 900,
                                    color: "crimson",
                                    marginBottom: 8,
                                }}
                            >
                                エラー
                            </div>
                            <div style={{ color: "crimson" }}>{err}</div>
                            <button
                                onClick={() => window.location.reload()}
                                style={{ marginTop: 16 }}
                            >
                                ページをリロードして再試行
                            </button>
                        </div>
                    )}
                </div>
            </Card>

            {import.meta.env?.DEV && (
                <DevDebug value={{ ticket, electionId, status }} />
            )}
        </Page>
    );
}
