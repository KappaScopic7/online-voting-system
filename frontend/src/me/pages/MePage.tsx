// me/pages/MePage.tsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchMeDetail } from "../../auth/api/authApi";
import type { MeDetailResponse } from "../../auth/model/authTypes";
import { useAuth } from "../../auth/AuthContext";
import {
    getMeProfile,
    putMeProfile,
    type MeProfileResponse,
} from "../../auth/api/meProfile";

export function MePage() {
    const { refreshMe } = useAuth();

    const [me, setMe] = useState<MeDetailResponse | null>(null);
    const [msg, setMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // self profile
    const [profile, setProfile] = useState<MeProfileResponse | null>(null);
    const [profileMsg, setProfileMsg] = useState<string | null>(null);

    // form
    const [birthDate, setBirthDate] = useState(""); // yyyy-MM-dd
    const [prefCode, setPrefCode] = useState("");
    const [cityCode, setCityCode] = useState("");
    const [saving, setSaving] = useState(false);

    const loc = useLocation();
    const from = loc.pathname + loc.search;

    const load = async () => {
        setIsLoading(true);
        setMsg(null);
        try {
            const data = await fetchMeDetail();
            setMe(data);
        } catch (err: any) {
            setMsg(err?.message ?? "Failed to load");
        } finally {
            setIsLoading(false);
        }
    };

    const loadProfile = async () => {
        setProfileMsg(null);
        try {
            const p = await getMeProfile();
            setProfile(p);
            setBirthDate(p.birthDate ?? "");
            setPrefCode(p.prefCode ?? "");
            setCityCode(p.cityCode ?? "");
        } catch (err: any) {
            // 404=未入力は正常系として扱う
            const m = err?.message ?? String(err);
            if (String(m).includes("404")) {
                setProfile(null);
                setBirthDate("");
                setPrefCode("");
                setCityCode("");
            } else {
                setProfile(null);
                setProfileMsg(m);
            }
        }
    };

    useEffect(() => {
        (async () => {
            await load();
            await loadProfile();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const identityStatus = me?.identityStatus ?? "UNKNOWN";
    const isLinked = identityStatus === "LINKED";
    const isPending = identityStatus === "PENDING";

    const onRefreshAll = async () => {
        setMsg(null);
        setProfileMsg(null);
        try {
            await refreshMe();
            await load();
            await loadProfile();
        } catch (err: any) {
            setMsg(err?.message ?? "Failed to refresh");
        }
    };

    const onSaveProfile = async () => {
        setProfileMsg(null);

        if (!birthDate || !prefCode || !cityCode) {
            setProfileMsg("birthDate / prefCode / cityCode を入力してください");
            return;
        }

        setSaving(true);
        try {
            const p = await putMeProfile({ birthDate, prefCode, cityCode });
            setProfile(p);
            setProfileMsg("保存しました");
        } catch (err: any) {
            setProfileMsg(err?.message ?? "保存に失敗しました");
        } finally {
            setSaving(false);
        }
    };

    const isDev = import.meta.env?.DEV;

    if (isLoading) return <div>Loading...</div>;

    return (
        <div style={{ maxWidth: 760, padding: 16, display: "grid", gap: 12 }}>
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <h2 style={{ margin: 0 }}>My Page</h2>
                <button type="button" onClick={onRefreshAll}>
                    再読み込み
                </button>
            </header>

            {msg && (
                <div
                    role="alert"
                    style={{ padding: 8, border: "1px solid #ccc" }}
                >
                    {msg}
                </div>
            )}

            {!me ? (
                <div>Not loaded</div>
            ) : (
                <>
                    {/* Status */}
                    <section style={{ padding: 12, border: "1px solid #ddd" }}>
                        <h3 style={{ marginTop: 0 }}>Status</h3>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                            <li>
                                Email Verified:{" "}
                                <b>{String(me.emailVerified)}</b>
                            </li>
                            <li>
                                Identity Status:{" "}
                                <b>{String(me.identityStatus)}</b>
                            </li>
                            <li>
                                Enabled: <b>{String(me.enabled)}</b>
                            </li>
                            <li>
                                Locked: <b>{String(me.locked)}</b>
                            </li>
                        </ul>

                        <div
                            style={{
                                marginTop: 10,
                                display: "flex",
                                gap: 12,
                                flexWrap: "wrap",
                            }}
                        >
                            <Link to="/elections" state={{ from }}>
                                選挙一覧へ
                            </Link>

                            <Link to="/me/elections" state={{ from }}>
                                My選挙へ
                            </Link>

                            <Link to="/me/votes" state={{ from }}>
                                投票履歴へ
                            </Link>

                            {!me.emailVerified && (
                                <Link
                                    to="/verify"
                                    state={{ email: me.email, from }}
                                >
                                    メール認証へ
                                </Link>
                            )}

                            {isPending && (
                                <Link
                                    to="/me/identity/pending"
                                    state={{ from }}
                                >
                                    本人認証：審査中
                                </Link>
                            )}
                        </div>
                    </section>

                    {/* Self Profile (本人認証前の自己申告プロフィール) */}
                    <section style={{ padding: 12, border: "1px solid #ddd" }}>
                        <h3 style={{ marginTop: 0 }}>
                            プロフィール（本人認証前）
                        </h3>

                        {isLinked ? (
                            <p style={{ margin: 0, opacity: 0.8 }}>
                                本人認証済みのため、自己申告プロフィールは編集できません（市民情報が優先されます）
                            </p>
                        ) : (
                            <p style={{ margin: 0, opacity: 0.8 }}>
                                My選挙の対象判定に使います（本人認証すると市民情報で上書きされます）
                            </p>
                        )}

                        {profileMsg && (
                            <div
                                style={{
                                    marginTop: 10,
                                    padding: 8,
                                    border: "1px solid #ccc",
                                }}
                            >
                                {profileMsg}
                            </div>
                        )}

                        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                            <label style={{ display: "grid", gap: 4 }}>
                                <span>生年月日（yyyy-MM-dd）</span>
                                <input
                                    value={birthDate}
                                    onChange={(e) =>
                                        setBirthDate(e.target.value)
                                    }
                                    placeholder="2000-01-01"
                                    disabled={isLinked || saving}
                                />
                            </label>

                            <label style={{ display: "grid", gap: 4 }}>
                                <span>都道府県コード</span>
                                <input
                                    value={prefCode}
                                    onChange={(e) =>
                                        setPrefCode(e.target.value)
                                    }
                                    placeholder="14"
                                    disabled={isLinked || saving}
                                />
                            </label>

                            <label style={{ display: "grid", gap: 4 }}>
                                <span>市区町村コード</span>
                                <input
                                    value={cityCode}
                                    onChange={(e) =>
                                        setCityCode(e.target.value)
                                    }
                                    placeholder="14100"
                                    disabled={isLinked || saving}
                                />
                            </label>

                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={onSaveProfile}
                                    disabled={isLinked || saving}
                                >
                                    {saving ? "保存中..." : "保存"}
                                </button>
                                <button
                                    type="button"
                                    onClick={loadProfile}
                                    disabled={saving}
                                >
                                    プロフィール再取得
                                </button>
                                {profile && (
                                    <span
                                        style={{ fontSize: 12, opacity: 0.75 }}
                                    >
                                        updatedAt: {profile.updatedAt}
                                    </span>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Account detail */}
                    <section>
                        <h3 style={{ marginBottom: 8 }}>Account</h3>
                        <table
                            style={{
                                borderCollapse: "collapse",
                                width: "100%",
                            }}
                        >
                            <tbody>
                                {Object.entries(me).map(([k, v]) => (
                                    <tr key={k}>
                                        <td
                                            style={{
                                                padding: "6px 12px",
                                                borderBottom: "1px solid #ddd",
                                                fontWeight: 600,
                                                width: 220,
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
                    </section>

                    {/* Identity section */}
                    <section style={{ padding: 12, border: "1px solid #ddd" }}>
                        <h3 style={{ marginTop: 0 }}>本人認証</h3>

                        {isLinked ? (
                            <p style={{ margin: 0 }}>
                                現在: <b>投票可能（本人認証済み）</b>
                            </p>
                        ) : isPending ? (
                            <div style={{ display: "grid", gap: 8 }}>
                                <p style={{ margin: 0 }}>
                                    現在: <b>投票不可（本人認証：審査中）</b>
                                </p>
                                <Link
                                    to="/me/identity/pending"
                                    state={{ from }}
                                >
                                    審査状況へ →
                                </Link>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gap: 8 }}>
                                <p style={{ margin: 0 }}>
                                    現在: <b>投票不可（本人認証が必要）</b>
                                </p>
                                <Link to="/me/identity" state={{ from }}>
                                    本人認証へ進む →
                                </Link>
                            </div>
                        )}
                    </section>
                </>
            )}

            {isDev && (
                <details>
                    <summary>Debug</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(
                            {
                                me,
                                msg,
                                identityStatus,
                                isLoading,
                                profile,
                                profileMsg,
                            },
                            null,
                            2,
                        )}
                    </pre>
                </details>
            )}
        </div>
    );
}
