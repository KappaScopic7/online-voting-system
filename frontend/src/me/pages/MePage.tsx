// frontend/src/me/pages/MePage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { fetchMeDetail, login } from "../../user/api/userAuthApi";
import type { MeDetailResponse } from "../../user/model/userAuthTypes";
import { useAuth } from "../../user/UserAuthContext";

import { getMeProfileOrNull } from "../api/profile";
import type { MeProfileResponse } from "../model/profileTypes";

import { Page, Card, DevDebug } from "../../shared/ui/page";
import { ErrorCard } from "../../shared/ui/ErrorCard";
import { useAsyncLoad } from "../../shared/hooks/useAsyncLoad";
import { useFromBackTo } from "../../shared/routes/useFromBackTo";

import { MeHeaderActions } from "../ui/me/MeHeaderActions";
import { QuickOverviewCard } from "../ui/me/QuickOverviewCard";
import { IdentityCard } from "../ui/me/IdentityCard";

import {
    fetchDemoPersonas,
    type DemoPersonaDto,
} from "../../demo/api/demoPersonas";

export function MePage() {
    const { refreshMe, setAccessToken } = useAuth();
    const { self, backTo } = useFromBackTo("/");

    const meLoad = useAsyncLoad<MeDetailResponse>(fetchMeDetail);
    const profileLoad = useAsyncLoad<MeProfileResponse | null>(
        getMeProfileOrNull,
    );

    // ✅ DEV personas (dynamic)
    const isDev = import.meta.env?.DEV;
    const [demoPersonas, setDemoPersonas] = useState<DemoPersonaDto[]>([]);
    const [demoErr, setDemoErr] = useState<string | null>(null);
    const [demoLoading, setDemoLoading] = useState(false);

    const loadDemoPersonas = async () => {
        if (!isDev) return;
        setDemoErr(null);
        setDemoLoading(true);
        try {
            const list = await fetchDemoPersonas();
            setDemoPersonas(Array.isArray(list) ? list : []);
        } catch (e: any) {
            // demoは失敗しても本体は動かす
            setDemoErr(
                e?.response?.data?.message ??
                    e?.message ??
                    "DEV personas の取得に失敗しました",
            );
            setDemoPersonas([]);
        } finally {
            setDemoLoading(false);
        }
    };

    const reloadAll = async () => {
        meLoad.setError(null);
        profileLoad.setError(null);

        try {
            await refreshMe();
        } catch {
            // refresh失敗してもページ表示は続けたいので握る
        }

        await Promise.all([meLoad.run(), profileLoad.run()]);
    };

    useEffect(() => {
        reloadAll();
        loadDemoPersonas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const me = meLoad.data;
    const profile = profileLoad.data;

    const isLoading = meLoad.isLoading || profileLoad.isLoading;

    const identityStatus = me?.identityStatus ?? "UNKNOWN";
    const isLinked = identityStatus === "LINKED";
    const isPending = identityStatus === "PENDING";

    const isCitizenSource = profile?.source === "CITIZEN";
    const disableSelfEdit = isLinked || isCitizenSource;

    // 「入力が揃ってる」判定（My選挙用の目安）
    const profileFilled = useMemo(() => {
        const birth = !!profile?.birthDate;
        const addr = !!profile?.prefCode && !!profile?.cityCode;
        return birth && addr;
    }, [profile]);

    const loginAs = async (p: { email: string; password: string }) => {
        meLoad.setError(null);
        profileLoad.setError(null);
        try {
            const token = await login(p.email, p.password);
            await setAccessToken(token.accessToken);

            // refreshMe があれば実施、なくても me/profile を取り直す
            try {
                await refreshMe();
            } catch {
                // ignore
            }

            await Promise.all([meLoad.run(), profileLoad.run()]);
        } catch (err: any) {
            meLoad.setError(
                err?.response?.data?.message ?? err?.message ?? "ログイン失敗",
            );
        }
    };

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>My Page</h1>}
            actions={
                <MeHeaderActions
                    returnTo={backTo}
                    refreshing={isLoading}
                    onReload={reloadAll}
                />
            }
            maxWidth={860}
        >
            {(meLoad.error || profileLoad.error) && (
                <ErrorCard
                    message={meLoad.error ?? profileLoad.error ?? "Error"}
                    actions={<button onClick={reloadAll}>再試行</button>}
                />
            )}

            {!me ? (
                <Card>
                    {isLoading
                        ? "読み込み中…"
                        : "ログイン情報を取得できませんでした"}
                </Card>
            ) : (
                <>
                    <QuickOverviewCard
                        me={me}
                        returnTo={backTo}
                        profileFilled={profileFilled}
                        disableSelfEdit={disableSelfEdit}
                        profileEditLinkFrom={self}
                    />

                    {/* Profile summary */}
                    <Card>
                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                flexWrap: "wrap",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 900, fontSize: 15 }}>
                                    判定用プロフィール
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        opacity: 0.75,
                                        lineHeight: 1.6,
                                    }}
                                >
                                    My選挙の対象判定に使用します（本人認証後は市民情報が優先されます）。
                                </div>
                            </div>

                            <Link
                                to="/me/profile"
                                state={{ from: self }}
                                style={{ marginLeft: "auto" }}
                            >
                                編集へ →
                            </Link>
                        </div>

                        <div
                            style={{
                                marginTop: 10,
                                fontSize: 13,
                                opacity: 0.85,
                                lineHeight: 1.7,
                            }}
                        >
                            生年月日: <b>{profile?.birthDate ?? "未入力"}</b> /
                            住所:{" "}
                            <b>
                                {profile?.prefCode && profile?.cityCode
                                    ? `${profile.prefCode}-${profile.cityCode}`
                                    : "未入力"}
                            </b>
                            {profile?.source ? (
                                <>
                                    {" "}
                                    / source: <b>{profile.source}</b>
                                </>
                            ) : null}
                        </div>
                    </Card>

                    <IdentityCard
                        isLinked={isLinked}
                        isPending={isPending}
                        returnTo={backTo}
                    />

                    {isDev && (
                        <details>
                            <summary style={{ cursor: "pointer" }}>
                                DEV tools
                            </summary>

                            <div
                                style={{
                                    display: "grid",
                                    gap: 12,
                                    marginTop: 10,
                                }}
                            >
                                <Card>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <div style={{ fontWeight: 900 }}>
                                            DEV: クイック状態切替
                                        </div>

                                        <button
                                            type="button"
                                            onClick={loadDemoPersonas}
                                            disabled={demoLoading}
                                            style={{
                                                marginLeft: "auto",
                                                fontSize: 12,
                                                padding: "6px 10px",
                                            }}
                                            title="バックエンドの /api/demo/personas から再取得"
                                        >
                                            {demoLoading
                                                ? "再読込中..."
                                                : "DEV一覧 再読込"}
                                        </button>
                                    </div>

                                    {demoErr && (
                                        <div
                                            style={{
                                                marginTop: 10,
                                                fontSize: 12,
                                                color: "crimson",
                                            }}
                                        >
                                            {demoErr}
                                        </div>
                                    )}

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            flexWrap: "wrap",
                                            marginTop: 10,
                                        }}
                                    >
                                        {demoPersonas.length === 0 ? (
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    opacity: 0.7,
                                                }}
                                            >
                                                {demoLoading
                                                    ? "読み込み中..."
                                                    : "DEV persona がありません（/api/demo/personas を確認）"}
                                            </div>
                                        ) : (
                                            demoPersonas.map((p) => (
                                                <button
                                                    key={p.key}
                                                    type="button"
                                                    onClick={() => loginAs(p)}
                                                    style={{
                                                        fontSize: 12,
                                                        padding: "6px 10px",
                                                        textAlign: "left",
                                                    }}
                                                    title={p.description}
                                                    disabled={isLoading}
                                                >
                                                    {p.label}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </Card>

                                <DevDebug
                                    value={{
                                        backTo,
                                        self,
                                        me,
                                        profile,
                                        isLoading,
                                        meError: meLoad.error,
                                        profileError: profileLoad.error,
                                        demoLoading,
                                        demoErr,
                                        demoPersonasCount: demoPersonas.length,
                                    }}
                                />
                            </div>
                        </details>
                    )}
                </>
            )}
        </Page>
    );
}
