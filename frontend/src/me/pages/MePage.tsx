// frontend/src/me/pages/MePage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { fetchMeDetail, login } from "../../user/api/userAuthApi";
import type { MeDetailResponse } from "../../user/model/userAuthTypes";
import { useAuth } from "../../user/UserAuthContext";

import { getMeProfile, putMeProfile } from "../../me/api/profile";
import type {
    MeProfileResponse,
    MeProfileUpdateRequest,
} from "../../me/model/profileTypes";

import { demoPersonas } from "../../demo/personas";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { currentAsFrom, sanitizeReturnTo } from "../../auth/routes/returnTo";
import { AddressInput } from "../ui/AddressInput";

function Badge({
    children,
    tone = "neutral",
}: {
    children: React.ReactNode;
    tone?: "neutral" | "good" | "warn" | "bad";
}) {
    const bg =
        tone === "good"
            ? "#ecfdf3"
            : tone === "warn"
              ? "#fff7ed"
              : tone === "bad"
                ? "#fef2f2"
                : "#f5f5f5";
    const bd =
        tone === "good"
            ? "#bbf7d0"
            : tone === "warn"
              ? "#fed7aa"
              : tone === "bad"
                ? "#fecaca"
                : "#e5e5e5";
    const fg =
        tone === "good"
            ? "#166534"
            : tone === "warn"
              ? "#9a3412"
              : tone === "bad"
                ? "#991b1b"
                : "#444";

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px solid ${bd}`,
                background: bg,
                color: fg,
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: "nowrap",
            }}
        >
            {children}
        </span>
    );
}

function Field({
    label,
    value,
    onChange,
    placeholder,
    disabled,
    hint,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    disabled?: boolean;
    hint?: string;
    type?: React.HTMLInputTypeAttribute;
}) {
    return (
        <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>{label}</div>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e5e5e5",
                    background: disabled ? "#fafafa" : "#fff",
                }}
            />
            {hint && (
                <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.5 }}>
                    {hint}
                </div>
            )}
        </label>
    );
}

export function MePage() {
    const { refreshMe, setAccessToken } = useAuth();
    const loc = useLocation();

    const state = (loc.state ?? {}) as { from?: string };
    const returnTo = useMemo(() => {
        const raw = state.from ?? currentAsFrom(loc.pathname, loc.search);
        return sanitizeReturnTo(raw ?? undefined, "/");
    }, [state.from, loc.pathname, loc.search]);

    const [me, setMe] = useState<MeDetailResponse | null>(null);
    const [msg, setMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // profile
    const [profile, setProfile] = useState<MeProfileResponse | null>(null);
    const [profileMsg, setProfileMsg] = useState<string | null>(null);

    // form
    const [birthDate, setBirthDate] = useState(""); // yyyy-MM-dd
    const [prefCode, setPrefCode] = useState("");
    const [cityCode, setCityCode] = useState("");

    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // UX: プロフィール編集を折りたたみ
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const autoOpenedProfileEditRef = useRef(false);

    const loadMe = async () => {
        setMsg(null);
        try {
            const data = await fetchMeDetail();
            setMe(data);
        } catch (err: any) {
            setMe(null);
            setMsg(
                err?.response?.data?.message ??
                    err?.message ??
                    "Failed to load",
            );
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
            const status = err?.response?.status;
            const m =
                err?.response?.data?.message ?? err?.message ?? String(err);

            // 404=未入力 → 正常扱い
            if (status === 404) {
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

    const reloadAll = async () => {
        setMsg(null);
        setProfileMsg(null);
        setRefreshing(true);
        try {
            await refreshMe();
            await Promise.all([loadMe(), loadProfile()]);
        } catch (err: any) {
            setMsg(
                err?.response?.data?.message ??
                    err?.message ??
                    "Failed to refresh",
            );
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        (async () => {
            setIsLoading(true);
            await Promise.all([loadMe(), loadProfile()]);
            setIsLoading(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const identityStatus = me?.identityStatus ?? "UNKNOWN";
    const isLinked = identityStatus === "LINKED";
    const isPending = identityStatus === "PENDING";
    const emailVerified = me?.emailVerified === true;

    // 編集可否
    const isCitizenSource = profile?.source === "CITIZEN";
    const disableSelfEdit = isLinked || isCitizenSource;

    // プロフィール入力の目安（空欄があると My選挙が出ない/減る）
    const profileFilled = !!birthDate && !!prefCode && !!cityCode;

    // 不足しているなら、初回だけ自動で編集を開く
    useEffect(() => {
        if (autoOpenedProfileEditRef.current) return;
        if (disableSelfEdit) return;
        if (profileFilled) return;
        setShowProfileEdit(true);
        autoOpenedProfileEditRef.current = true;
    }, [disableSelfEdit, profileFilled]);

    const cannotSaveReason = useMemo(() => {
        if (disableSelfEdit)
            return "本人認証済み/市民情報由来のため編集できません";
        if (saving) return "保存中です";
        const hasBirth = !!birthDate;
        const addressComplete = !!prefCode && !!cityCode;
        const addressHalf =
            (!!prefCode && !cityCode) || (!prefCode && !!cityCode);

        if (addressHalf)
            return "住所は都道府県と市区町村を両方入力してください";
        if (!hasBirth && !addressComplete)
            return "生年月日 もしくは 住所（都道府県+市区町村）を入力してください";
        return null;
    }, [disableSelfEdit, saving, birthDate, prefCode, cityCode]);

    const canSaveProfile = useMemo(() => {
        return cannotSaveReason === null;
    }, [cannotSaveReason]);

    const onSaveProfile = async () => {
        setProfileMsg(null);

        const hasBirth = !!birthDate;
        const addressComplete = !!prefCode && !!cityCode;

        if (!hasBirth && !addressComplete) {
            setProfileMsg("生年月日または住所を入力してください");
            return;
        }
        if ((prefCode && !cityCode) || (!prefCode && cityCode)) {
            setProfileMsg("住所は都道府県と市区町村を両方入力してください");
            return;
        }

        // ★ 空欄は送らない（部分更新：未送信項目は維持）
        const payload: MeProfileUpdateRequest = {
            ...(birthDate ? { birthDate } : {}),
            ...(prefCode ? { prefCode } : {}),
            ...(cityCode ? { cityCode } : {}),
        };

        setSaving(true);
        try {
            const p = await putMeProfile(payload);
            setProfile(p);

            // ★ 保存結果でフォームも同期（反映されない感を消す）
            setBirthDate(p.birthDate ?? "");
            setPrefCode(p.prefCode ?? "");
            setCityCode(p.cityCode ?? "");

            setProfileMsg("保存しました");
            setShowProfileEdit(false);
        } catch (err: any) {
            setProfileMsg(
                err?.response?.data?.message ??
                    err?.message ??
                    "保存に失敗しました",
            );
        } finally {
            setSaving(false);
        }
    };

    const loginAs = async (p: { email: string; password: string }) => {
        setMsg(null);
        setProfileMsg(null);
        try {
            const token = await login(p.email, p.password);
            await setAccessToken(token.accessToken);
            await Promise.all([loadMe(), loadProfile()]);
        } catch (err: any) {
            setMsg(
                err?.response?.data?.message ?? err?.message ?? "ログイン失敗",
            );
        }
    };

    const isDev = import.meta.env?.DEV;

    // 状態バッジの優先度（ユーザーが今すべきことが分かる）
    const topAlerts = useMemo(() => {
        const list: {
            tone: "warn" | "bad";
            title: string;
            body: string;
            cta?: React.ReactNode;
        }[] = [];

        if (!emailVerified) {
            list.push({
                tone: "warn",
                title: "メール認証が未完了です",
                body: "投票機能の制限がかかる可能性があります。先にメール認証を完了してください。",
                cta: me?.email ? (
                    <Link
                        to="/verify"
                        state={{ email: me.email, from: returnTo }}
                    >
                        メール認証へ →
                    </Link>
                ) : (
                    <Link to="/verify" state={{ from: returnTo }}>
                        メール認証へ →
                    </Link>
                ),
            });
        }

        if (isPending) {
            list.push({
                tone: "warn",
                title: "本人認証：審査中です",
                body: "審査が完了するまで投票できません。",
                cta: (
                    <Link to="/me/identity/pending" state={{ from: returnTo }}>
                        審査状況を見る →
                    </Link>
                ),
            });
        } else if (!isLinked) {
            list.push({
                tone: "warn",
                title: "本人認証が未完了です",
                body: "投票するには本人認証が必要です。",
                cta: (
                    <Link to="/me/identity" state={{ from: returnTo }}>
                        本人認証へ進む →
                    </Link>
                ),
            });
        }

        if (!profileFilled && !disableSelfEdit) {
            list.push({
                tone: "warn",
                title: "プロフィール情報が不足しています",
                body: "My選挙の対象判定に使います（本人認証後は市民情報で上書きされます）。",
                cta: (
                    <button
                        type="button"
                        onClick={() => setShowProfileEdit(true)}
                    >
                        プロフィールを入力する →
                    </button>
                ),
            });
        }

        return list;
    }, [
        emailVerified,
        isPending,
        isLinked,
        profileFilled,
        disableSelfEdit,
        me?.email,
        returnTo,
    ]);

    if (isLoading) {
        return (
            <Page
                title={<h1 style={{ margin: 0, fontSize: 20 }}>My Page</h1>}
                actions={
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <Link to={returnTo}>← 戻る</Link>
                    </div>
                }
                maxWidth={860}
            >
                <Card>読み込み中…</Card>
            </Page>
        );
    }

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>My Page</h1>}
            actions={
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <Link to={returnTo}>← 戻る</Link>
                    <button
                        type="button"
                        onClick={reloadAll}
                        disabled={refreshing}
                    >
                        {refreshing ? "更新中..." : "再読み込み"}
                    </button>
                </div>
            }
            maxWidth={860}
        >
            {msg && (
                <Card role="alert">
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>
                        エラー
                    </div>
                    <div>{msg}</div>
                </Card>
            )}

            {!me ? (
                <Card>ログイン情報を取得できませんでした</Card>
            ) : (
                <>
                    {/* ===== 1) クイック概要 ===== */}
                    <Card>
                        <div style={{ display: "grid", gap: 12 }}>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 10,
                                    alignItems: "baseline",
                                    flexWrap: "wrap",
                                }}
                            >
                                <div style={{ fontSize: 16, fontWeight: 900 }}>
                                    {me.email ?? "ユーザー"}
                                </div>
                                <span style={{ fontSize: 12, opacity: 0.7 }}>
                                    accountId: {me.accountId}
                                </span>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Badge tone={emailVerified ? "good" : "warn"}>
                                    {emailVerified
                                        ? "メール認証済み"
                                        : "メール未認証"}
                                </Badge>

                                <Badge tone={isLinked ? "good" : "warn"}>
                                    {isLinked
                                        ? "本人認証済み"
                                        : isPending
                                          ? "本人認証：審査中"
                                          : "本人認証：未完了"}
                                </Badge>

                                <Badge tone={me.enabled ? "good" : "bad"}>
                                    {me.enabled
                                        ? "有効アカウント"
                                        : "無効アカウント"}
                                </Badge>

                                <Badge tone={me.locked ? "bad" : "good"}>
                                    {me.locked ? "ロック中" : "ロックなし"}
                                </Badge>
                            </div>

                            {/* 重要アラート（必要な時だけ出る） */}
                            {topAlerts.length > 0 && (
                                <div style={{ display: "grid", gap: 10 }}>
                                    {topAlerts.map((a, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                border: "1px solid #eee",
                                                borderRadius: 12,
                                                padding: 12,
                                                background: "#fafafa",
                                                display: "grid",
                                                gap: 6,
                                            }}
                                        >
                                            <div style={{ fontWeight: 900 }}>
                                                {a.title}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 13,
                                                    opacity: 0.85,
                                                    lineHeight: 1.6,
                                                }}
                                            >
                                                {a.body}
                                            </div>
                                            {a.cta ? (
                                                <div style={{ marginTop: 4 }}>
                                                    {a.cta}
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* メイン導線 */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Link
                                    to="/me/elections"
                                    state={{ from: returnTo }}
                                >
                                    <b>My選挙へ →</b>
                                </Link>
                                <Link to="/me/votes" state={{ from: returnTo }}>
                                    投票履歴 →
                                </Link>
                                <Link
                                    to="/elections"
                                    state={{ from: returnTo }}
                                >
                                    選挙一覧 →
                                </Link>
                            </div>
                        </div>
                    </Card>

                    {/* ===== 2) プロフィール（必要な時だけ編集） ===== */}
                    <Card>
                        <div style={{ display: "grid", gap: 12 }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    flexWrap: "wrap",
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            fontWeight: 900,
                                            fontSize: 15,
                                        }}
                                    >
                                        判定用プロフィール
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            opacity: 0.75,
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        My選挙の対象判定に使います。本人認証済みの場合は市民情報が優先され、編集できません。
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        gap: 10,
                                        alignItems: "center",
                                    }}
                                >
                                    {profile?.source ? (
                                        <Badge
                                            tone={
                                                profile.source === "CITIZEN"
                                                    ? "good"
                                                    : "neutral"
                                            }
                                        >
                                            source: {profile.source}
                                        </Badge>
                                    ) : (
                                        <Badge tone="neutral">未登録</Badge>
                                    )}

                                    {!disableSelfEdit && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowProfileEdit((v) => !v)
                                            }
                                        >
                                            {showProfileEdit
                                                ? "閉じる"
                                                : "編集する"}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* 要約表示 */}
                            <div
                                style={{
                                    display: "grid",
                                    gap: 6,
                                    fontSize: 13,
                                }}
                            >
                                <div>
                                    生年月日:{" "}
                                    <b>{profile?.birthDate ?? "(未登録)"}</b>
                                </div>
                                <div>
                                    都道府県コード:{" "}
                                    <b>{profile?.prefCode ?? "(未登録)"}</b>
                                </div>
                                <div>
                                    市区町村コード:{" "}
                                    <b>{profile?.cityCode ?? "(未登録)"}</b>
                                </div>
                                {profile?.updatedAt && (
                                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                                        updatedAt: {profile.updatedAt}
                                    </div>
                                )}
                            </div>

                            {disableSelfEdit && (
                                <div style={{ fontSize: 12, opacity: 0.75 }}>
                                    ※
                                    本人認証済み/市民情報由来のため、自己申告プロフィールは編集できません。
                                </div>
                            )}

                            {profileMsg && (
                                <div
                                    style={{
                                        border: "1px solid #eee",
                                        borderRadius: 12,
                                        padding: 10,
                                    }}
                                >
                                    {profileMsg}
                                </div>
                            )}

                            {/* 編集フォーム（折りたたみ） */}
                            {showProfileEdit && !disableSelfEdit && (
                                <div style={{ display: "grid", gap: 10 }}>
                                    <Field
                                        label="生年月日"
                                        value={birthDate}
                                        onChange={setBirthDate}
                                        disabled={saving}
                                        type="date"
                                    />

                                    <div style={{ display: "grid", gap: 8 }}>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 800,
                                            }}
                                        >
                                            住所
                                        </div>
                                        <AddressInput
                                            prefCode={prefCode}
                                            cityCode={cityCode}
                                            onChangePref={setPrefCode}
                                            onChangeCity={setCityCode}
                                            disabled={saving}
                                        />
                                        <div
                                            style={{
                                                fontSize: 12,
                                                opacity: 0.7,
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            ※ 郵便番号 or
                                            選択で入力できます（保存は
                                            prefCode/cityCode）
                                        </div>
                                    </div>

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
                                            disabled={!canSaveProfile}
                                            title={
                                                cannotSaveReason ?? undefined
                                            }
                                        >
                                            {saving ? "保存中..." : "保存"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={loadProfile}
                                            disabled={saving}
                                        >
                                            再取得
                                        </button>

                                        {cannotSaveReason && (
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    opacity: 0.7,
                                                }}
                                            >
                                                保存不可: {cannotSaveReason}
                                            </span>
                                        )}

                                        {!profileFilled &&
                                            !cannotSaveReason && (
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        opacity: 0.7,
                                                    }}
                                                >
                                                    ※ 入力が揃うと
                                                    My選挙の対象判定が安定します
                                                </span>
                                            )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* ===== 3) 本人認証（明確なCTA） ===== */}
                    <Card>
                        <div style={{ display: "grid", gap: 10 }}>
                            <div style={{ fontWeight: 900, fontSize: 15 }}>
                                本人認証
                            </div>

                            {isLinked ? (
                                <div style={{ fontSize: 13 }}>
                                    現在: <b>投票可能（本人認証済み）</b>
                                </div>
                            ) : isPending ? (
                                <div style={{ display: "grid", gap: 8 }}>
                                    <div style={{ fontSize: 13 }}>
                                        現在: <b>投票不可（審査中）</b>
                                    </div>
                                    <Link
                                        to="/me/identity/pending"
                                        state={{ from: returnTo }}
                                    >
                                        審査状況を見る →
                                    </Link>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gap: 8 }}>
                                    <div style={{ fontSize: 13 }}>
                                        現在: <b>投票不可（本人認証が必要）</b>
                                    </div>
                                    <Link
                                        to="/me/identity"
                                        state={{ from: returnTo }}
                                    >
                                        本人認証へ進む →
                                    </Link>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* ===== DEV（折りたたみ） ===== */}
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
                                            fontWeight: 900,
                                            marginBottom: 10,
                                        }}
                                    >
                                        DEV: クイック状態切替
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        {Object.values(demoPersonas.voter).map(
                                            (p) => (
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
                                                >
                                                    {p.label}
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </Card>

                                <Card>
                                    <div
                                        style={{
                                            fontWeight: 900,
                                            marginBottom: 8,
                                        }}
                                    >
                                        Account raw
                                    </div>
                                    <pre
                                        style={{
                                            margin: 0,
                                            whiteSpace: "pre-wrap",
                                            fontSize: 12,
                                            opacity: 0.85,
                                        }}
                                    >
                                        {JSON.stringify(me, null, 2)}
                                    </pre>
                                </Card>

                                <DevDebug
                                    value={{ me, profile, returnTo, state }}
                                />
                            </div>
                        </details>
                    )}
                </>
            )}
        </Page>
    );
}
