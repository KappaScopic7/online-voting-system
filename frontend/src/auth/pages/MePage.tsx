// auth/pages/MePage.tsx
import { useEffect, useState } from "react";
import { fetchMeDetail, type MeDetailResponse } from "../api/auth";
import { linkIdentity } from "../../identity/api/identity";
import { useAuth } from "../AuthContext";

export function MePage() {
    const { refreshMe } = useAuth();
    const [me, setMe] = useState<MeDetailResponse | null>(null);
    const [citizenId, setCitizenId] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const load = async () => {
        setIsLoading(true);
        setMsg(null);
        try {
            const data = await fetchMeDetail();
            setMe(data);
            setCitizenId(data.citizenId ?? "");
        } catch (err: any) {
            setMsg(err?.response?.data?.message ?? "Failed to load");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        try {
            await linkIdentity(citizenId.trim());
            // me系を再取得（AuthContext側のmeも更新）
            await refreshMe();
            await load();
            setMsg(
                "本人認証（citizenId）を登録しました。投票可能になっているはず！",
            );
        } catch (err: any) {
            setMsg(err?.response?.data?.message ?? "Failed to link identity");
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div style={{ maxWidth: 720 }}>
            <h2>My Page</h2>
            {msg && <p style={{ marginTop: 8 }}>{msg}</p>}

            {!me ? (
                <div>Not loaded</div>
            ) : (
                <>
                    <h3 style={{ marginTop: 16 }}>Account</h3>
                    <table style={{ borderCollapse: "collapse" }}>
                        <tbody>
                            {Object.entries(me).map(([k, v]) => (
                                <tr key={k}>
                                    <td
                                        style={{
                                            padding: "6px 12px",
                                            borderBottom: "1px solid #ddd",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {k}
                                    </td>
                                    <td
                                        style={{
                                            padding: "6px 12px",
                                            borderBottom: "1px solid #ddd",
                                        }}
                                    >
                                        {v === null ? "null" : String(v)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <h3 style={{ marginTop: 16 }}>
                        本人認証（デモ：UUID入力）
                    </h3>
                    <p style={{ marginTop: 8 }}>
                        citizenId を入れると <code>/api/identity/link</code>{" "}
                        で保存され、投票可能状態になります。
                    </p>

                    <form
                        onSubmit={onLink}
                        style={{ display: "grid", gap: 8, maxWidth: 520 }}
                    >
                        <input
                            value={citizenId}
                            onChange={(e) => setCitizenId(e.target.value)}
                            placeholder="citizenId (UUID) 例: 550e8400-e29b-41d4-a716-446655440000"
                        />
                        <button
                            type="submit"
                            disabled={!citizenId.trim() || me.identityLinked}
                        >
                            {me.identityLinked
                                ? "本人認証済み"
                                : "本人認証を登録"}
                        </button>
                    </form>

                    <p style={{ marginTop: 8 }}>
                        現在:{" "}
                        <b>
                            {me.identityLinked
                                ? "投票可能（本人認証済み）"
                                : "投票不可（本人認証まだ）"}
                        </b>
                    </p>
                </>
            )}
        </div>
    );
}
