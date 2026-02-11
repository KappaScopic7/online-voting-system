// frontend/src/auth/pages/UserLinkCallbackPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Page } from "../../shared/ui/page";
import { httpAnon } from "../../shared/httpAnon";
import { httpUser } from "../../shared/httpUser";
import { userToken } from "../../shared/tokenStorage";
import { normalizeFrom } from "../../shared/normalizeFrom";

type ExchangeRes = { citizenId: string };
type LinkRes = { accessToken: string };

export function UserLinkCallbackPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const didRunRef = useRef(false);

    const q = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
    const ticket = (q.get("ticket") ?? "").trim();
    const returnToRaw = (q.get("returnTo") ?? "").trim();
    const returnTo = normalizeFrom(returnToRaw || "/me/identity");

    const [msg, setMsg] = useState("認証結果を確認しています…");

    useEffect(() => {
        if (didRunRef.current) return;
        didRunRef.current = true;

        // ログインしてないなら先にログインへ（最低限）
        if (!userToken.get()) {
            nav("/login", { replace: true, state: { from: "/me/identity" } });
            return;
        }

        if (!ticket) {
            nav("/me/identity", { replace: true });
            return;
        }

        (async () => {
            setMsg("NFC認証結果を取得中…");

            // ticket -> citizenId
            const ex = await httpAnon.post<ExchangeRes>(
                "/auth/nfc/link/exchange",
                { ticket },
            );
            const citizenId = (ex.data?.citizenId ?? "").trim();
            if (!citizenId) throw new Error("citizenId missing");

            setMsg("紐付けを確定中…");

            // ✅ ここがログイン後Linkの本体（USER JWT必須）
            const linked = await httpUser.post<LinkRes>("/identity/link", {
                citizenId,
            });
            const newToken = (linked.data?.accessToken ?? "").trim();

            // サーバが新トークン返す設計なら更新（返さないならこの行は消してOK）
            if (newToken) userToken.set(newToken);

            nav(returnTo, { replace: true });
        })().catch(() => {
            setMsg("紐付けに失敗しました。やり直してください。");
            nav("/me/identity", { replace: true });
        });
    }, [ticket, returnTo, nav]);

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>本人認証</h1>}
            maxWidth={720}
        >
            <Card>{msg}</Card>
        </Page>
    );
}
