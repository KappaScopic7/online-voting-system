// pages/IdentityLinkPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../../shared/http";
import { useAuth } from "../../auth/AuthContext";

type TokenResponse = {
    accessToken: string;
    tokenType: string;
    expiresInSeconds: number;
    role: string | null;
};

export function IdentityLinkPage() {
    const nav = useNavigate();
    const { refreshMe, setAccessToken } = useAuth();
    const [citizenId, setCitizenId] = useState("");
    const [msg, setMsg] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);

        try {
            // ★ linkのレスポンスで新トークンを受け取る
            const res = await http.post<TokenResponse>("/api/identity/link", {
                citizenId,
            });

            // ★ 新トークン保存 → me再取得（role=VOTERが反映される）
            await setAccessToken(res.data.accessToken);
            await refreshMe();

            nav("/");
        } catch (err: any) {
            setMsg(err?.response?.data?.message ?? "Link failed");
        }
    };

    return (
        <div>
            <h2>Link Identity</h2>
            <form
                onSubmit={onSubmit}
                style={{ display: "grid", gap: 8, maxWidth: 420 }}
            >
                <input
                    value={citizenId}
                    onChange={(e) => setCitizenId(e.target.value)}
                    placeholder="citizenId (uuid)"
                />
                <button type="submit">Link</button>
            </form>
            {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
        </div>
    );
}
