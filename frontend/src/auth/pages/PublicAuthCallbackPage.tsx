// frontend/src/auth/pages/PublicAuthCallbackPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { httpAnon } from "../../shared/httpAnon";
import { publicToken } from "../../shared/tokenStorage";
import { normalizeFrom } from "../../shared/normalizeFrom";

type ExchangeResponse = {
    accessToken: string;
    tokenType?: string;
    expiresIn?: number;
    role?: string | null;
};

export function PublicAuthCallbackPage() {
    const nav = useNavigate();
    const loc = useLocation();

    const didRunRef = useRef(false);

    const q = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
    const ticket = (q.get("ticket") ?? "").trim();
    const electionId = (q.get("electionId") ?? "").trim();
    const returnToRaw = (q.get("returnTo") ?? "").trim(); // 任意（Androidから渡せる）
    const returnTo = normalizeFrom(returnToRaw || "");

    const [msg, setMsg] = useState("認証結果を確認しています…");

    useEffect(() => {
        if (didRunRef.current) return;
        didRunRef.current = true;

        if (!ticket || !electionId) {
            nav("/elections", { replace: true });
            return;
        }

        (async () => {
            setMsg("本人認証トークンを発行中…");

            // ✅ ticket -> voteToken 交換（サーバが返す accessToken を publicToken に保存）
            const res = await httpAnon.post<ExchangeResponse>(
                "/auth/nfc/exchange",
                { ticket },
            );

            const t = (res.data?.accessToken ?? "").trim();
            if (!t) throw new Error("accessToken missing");

            publicToken.set(t);

            // ✅ URLに token を載せず、VotingEntryPage に任せる
            // returnTo があれば優先（ないなら voting/entry へ）
            const to =
                returnToRaw && returnToRaw.startsWith("/")
                    ? returnToRaw
                    : `/voting/entry?electionId=${encodeURIComponent(
                          electionId,
                      )}&session=public`;

            nav(to, { replace: true });
        })().catch((e) => {
            console.error(e);
            publicToken.clear();
            setMsg("認証に失敗しました。もう一度やり直してください。");

            nav(
                `/identity/vote?electionId=${encodeURIComponent(
                    electionId,
                )}&session=public`,
                { replace: true },
            );
        });
    }, [ticket, electionId, nav, returnToRaw, returnTo]);

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>本人認証</h1>}
            maxWidth={720}
        >
            <Card>{msg}</Card>
            <DevDebug
                value={{
                    ticket: ticket ? "(present)" : null,
                    electionId,
                    returnTo: returnToRaw || null,
                    hasPublicToken: !!publicToken.get(),
                }}
            />
        </Page>
    );
}
