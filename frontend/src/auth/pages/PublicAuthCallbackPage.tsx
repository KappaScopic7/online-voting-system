import { useEffect, useMemo, useState, useRef } from "react"; // useRefを追加
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

    // ★追加: 二重実行を防ぐためのフラグ
    const processedRef = useRef(false);

    useEffect(() => {
        // ★追加: 既に処理済みなら何もしない
        if (processedRef.current) return;
        if (!ticket) return; // チケットがない場合もガード

        // ★追加: フラグを立てる（これで2回目は通らない）
        processedRef.current = true;

        (async () => {
            try {
                setErr(null);
                setStatus("PROCESSING");

                // if (!ticket) throw new Error("ticket がありません"); // 上でチェック済み

                const res = await exchangeNfcTicket({ ticket, electionId });

                const accessToken = (res?.accessToken ?? "").trim();
                if (!accessToken)
                    throw new Error("accessToken が返りませんでした");

                // ✅ PCブラウザに public session token を保存
                publicToken.set(accessToken);

                setStatus("DONE");
                // 遷移を少し待つ（ユーザーに完了を見せるため）
                window.setTimeout(() => nav(returnTo, { replace: true }), 500);
            } catch (e: any) {
                // エラーになった場合、フラグを戻すかどうかは要件次第だが、
                // チケット消費エラーの場合は戻しても意味がないので戻さない。
                setStatus("ERROR");
                setErr(
                    e?.response?.data?.message ?? e?.message ?? "exchange 失敗",
                );
            }
        })();
        // 依存配列から ticket, electionId 等を外して、マウント時の1回だけに限定しても良いが
        // useRefでガードしているのでこのままでも大丈夫
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
