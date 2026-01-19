// identity/pages/IdentityLinkPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { linkIdentity } from "../api/identity";
import { useAuth } from "../../auth/AuthContext";

export function IdentityLinkPage() {
    const nav = useNavigate();
    const { setAccessToken, refreshMe } = useAuth();
    const [citizenId, setCitizenId] = useState("");
    const [msg, setMsg] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);

        try {
            const token = await linkIdentity(citizenId.trim());

            // 新JWT保存 → me更新
            await setAccessToken(token.accessToken);
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
            <div style={{ marginTop: 16 }}>
                Raw JSON
                <pre style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(
                        {
                            citizenId,
                            msg,
                        },
                        null,
                        2,
                    )}
                </pre>
            </div>
        </div>
    );
}
