import { useEffect, useMemo, useState, useRef } from "react";
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

    const returnTo = useMemo(() => {
        const fallback = electionIdQ
            ? `/voting/entry?electionId=${encodeURIComponent(electionIdQ)}&session=public`
            : "/elections";
        return normalizeFrom(returnToQ || fallback);
    }, [returnToQ, electionIdQ]);

    const [status, setStatus] = useState<"PROCESSING" | "ERROR" | "DONE">(
        "PROCESSING",
    );
    const [err, setErr] = useState<string | null>(null);

    // ★二重実行防止フラグ
    const processedRef = useRef(false);

    useEffect(() => {
        if (processedRef.current) return;
        if (!ticket) return;

        processedRef.current = true;

        (async () => {
            try {
                setErr(null);
                setStatus("PROCESSING");

                const res = await exchangeNfcTicket({ ticket, electionId });

                const accessToken = (res?.accessToken ?? "").trim();
                if (!accessToken)
                    throw new Error("accessToken が返りませんでした");

                publicToken.set(accessToken);

                setStatus("DONE");
                window.setTimeout(() => nav(returnTo, { replace: true }), 500);
            } catch (e: any) {
                setStatus("ERROR");
                setErr(
                    e?.response?.data?.message ?? e?.message ?? "exchange 失敗",
                );
            }
        })();
    }, [ticket, electionId, returnTo, nav]);

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>認証処理</h1>}
            maxWidth={680}
        >
            <Card>
                {status === "PROCESSING" && (
                    <div style={{ fontWeight: 800 }}>
                        認証情報をPCに反映しています…
                    </div>
                )}
                {status === "DONE" && (
                    <div style={{ fontWeight: 800, color: "green" }}>
                        認証完了！投票画面へ移動します…
                    </div>
                )}
                {status === "ERROR" && (
                    <div>
                        <div
                            style={{
                                fontWeight: 900,
                                marginBottom: 8,
                                color: "crimson",
                            }}
                        >
                            エラーが発生しました
                        </div>
                        <div
                            style={{ whiteSpace: "pre-wrap", color: "crimson" }}
                        >
                            {err}
                        </div>
                        <div
                            style={{
                                marginTop: 12,
                                fontSize: 12,
                                opacity: 0.8,
                            }}
                        >
                            ※ もう一度QRコードを読み取ってやり直してください。
                        </div>
                    </div>
                )}
            </Card>

            {import.meta.env?.DEV && (
                <DevDebug
                    value={{
                        ticket: ticket ? "(present)" : null,
                        electionIdQ,
                        returnTo,
                    }}
                />
            )}
        </Page>
    );
}
