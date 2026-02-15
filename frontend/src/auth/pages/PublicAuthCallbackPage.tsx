import { useEffect, useMemo, useState } from "react";
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

    useEffect(() => {
        (async () => {
            try {
                setErr(null);
                setStatus("PROCESSING");

                if (!ticket) throw new Error("ticket がありません");

                const res = await exchangeNfcTicket({ ticket, electionId });

                const accessToken = (res?.accessToken ?? "").trim();
                if (!accessToken)
                    throw new Error("accessToken が返りませんでした");

                // ✅ PCブラウザに public session token を保存
                publicToken.set(accessToken);

                setStatus("DONE");
                window.setTimeout(() => nav(returnTo, { replace: true }), 150);
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
                    <div style={{ fontWeight: 800 }}>
                        認証完了。投票画面へ移動します…
                    </div>
                )}
                {status === "ERROR" && (
                    <div>
                        <div style={{ fontWeight: 900, marginBottom: 8 }}>
                            エラー
                        </div>
                        <div style={{ whiteSpace: "pre-wrap" }}>{err}</div>
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
