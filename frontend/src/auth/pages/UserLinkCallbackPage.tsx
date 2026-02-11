// frontend/src/auth/pages/UserLinkCallbackPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Page } from "../../shared/ui/page";
import { httpAnon } from "../../shared/httpAnon";
import { httpUser } from "../../shared/httpUser";
import { userToken } from "../../shared/tokenStorage";
import { normalizeFrom } from "../../shared/normalizeFrom";

type ExchangeRes = { citizenId: string };
type LinkRes = { accessToken?: string };

export function UserLinkCallbackPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const didRunRef = useRef(false);

    const q = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
    const ticket = (q.get("ticket") ?? "").trim();
    const returnToRaw = (q.get("returnTo") ?? "").trim();
    const returnTo = normalizeFrom(returnToRaw || "/me/identity");

    const self = loc.pathname + loc.search;

    const [msg, setMsg] = useState("認証結果を確認しています…");

    useEffect(() => {
        if (didRunRef.current) return;
        didRunRef.current = true;

        // ticket必須
        if (!ticket) {
            nav("/me/identity", { replace: true });
            return;
        }

        // ログイン必須（ここは「callbackに戻す」）
        if (!userToken.get()) {
            nav("/login", { replace: true, state: { from: self } });
            return;
        }

        (async () => {
            setMsg("NFC認証結果を取得中…");

            // ticket -> citizenId（permitAll）
            const ex = await httpAnon.post<ExchangeRes>(
                "/auth/nfc/link/exchange",
                { ticket },
            );
            const citizenId = (ex.data?.citizenId ?? "").trim();
            if (!citizenId) throw new Error("citizenId missing");

            setMsg("紐付けを確定中…");

            // ✅ ログイン後IdentityLinkの本体（USER JWT必須）
            const linked = await httpUser.post<LinkRes>("/identity/link", {
                citizenId,
            });

            // サーバが新トークン返す設計なら更新（返さないなら無視でOK）
            const newToken = (linked.data?.accessToken ?? "").trim();
            if (newToken) userToken.set(newToken);

            nav(returnTo, { replace: true });
        })().catch((e) => {
            console.error(e);
            setMsg("紐付けに失敗しました。やり直してください。");
            nav(returnTo, { replace: true });
        });
    }, [ticket, returnTo, nav, self]);

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>本人認証</h1>}
            maxWidth={720}
        >
            <Card>{msg}</Card>
        </Page>
    );
}
