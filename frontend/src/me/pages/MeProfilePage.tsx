import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { Page, Card, DevDebug } from "../../shared/ui/page";
import { ErrorCard } from "../../shared/ui/ErrorCard";
import { useFromBackTo } from "../../shared/routes/useFromBackTo";

import { getMeProfileOrNull, putMeProfile } from "../api/profile";
import type {
    MeProfileResponse,
    MeProfileUpdateRequest,
} from "../model/profileTypes";

import { AddressInput } from "../ui/AddressInput";
import { Badge } from "../ui/me/Badge";

type LocationState = { from?: string };

export function MeProfilePage() {
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    // 「戻る」は /me をデフォに
    const { self, backTo } = useFromBackTo("/me");

    const [profile, setProfile] = useState<MeProfileResponse | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [msg, setMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // form
    const [birthDate, setBirthDate] = useState(""); // yyyy-MM-dd
    const [prefCode, setPrefCode] = useState("");
    const [cityCode, setCityCode] = useState("");

    const load = async () => {
        setErr(null);
        setMsg(null);
        setLoading(true);
        try {
            const p = await getMeProfileOrNull();
            setProfile(p);
            setBirthDate((p?.birthDate ?? "") || "");
            setPrefCode((p?.prefCode ?? "") || "");
            setCityCode((p?.cityCode ?? "") || "");
        } catch (e: any) {
            const m = e?.response?.data?.message ?? e?.message ?? String(e);
            setErr(m);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const identityLocked = profile?.source === "CITIZEN";

    const cannotSaveReason = useMemo(() => {
        if (identityLocked)
            return "本人認証済み（市民情報由来）のため編集できません";
        if (saving) return "保存中です";

        const hasBirth = !!birthDate;
        const addrComplete = !!prefCode && !!cityCode;
        const addrHalf = (!!prefCode && !cityCode) || (!prefCode && !!cityCode);

        if (addrHalf) return "住所は都道府県と市区町村を両方入力してください";
        if (!hasBirth && !addrComplete)
            return "生年月日 もしくは 住所（都道府県+市区町村）を入力してください";
        return null;
    }, [identityLocked, saving, birthDate, prefCode, cityCode]);

    const canSave = cannotSaveReason === null;

    const onSave = async () => {
        setErr(null);
        setMsg(null);

        if (!canSave) {
            setMsg(cannotSaveReason ?? "保存できません");
            return;
        }

        // 空欄は送らない（部分更新）
        const payload: MeProfileUpdateRequest = {
            ...(birthDate ? { birthDate } : {}),
            ...(prefCode ? { prefCode } : {}),
            ...(cityCode ? { cityCode } : {}),
        };

        setSaving(true);
        try {
            const p = await putMeProfile(payload);
            setProfile(p);

            // 反映同期
            setBirthDate((p.birthDate ?? "") || "");
            setPrefCode((p.prefCode ?? "") || "");
            setCityCode((p.cityCode ?? "") || "");

            setMsg("保存しました");
        } catch (e: any) {
            setErr(
                e?.response?.data?.message ??
                    e?.message ??
                    "保存に失敗しました",
            );
        } finally {
            setSaving(false);
        }
    };

    const isDev = import.meta.env?.DEV;

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>プロフィール</h1>}
            actions={
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <Link to={backTo}>← 戻る</Link>
                    <button
                        type="button"
                        onClick={load}
                        disabled={loading || saving}
                    >
                        {loading ? "読み込み中..." : "再取得"}
                    </button>
                </div>
            }
            maxWidth={860}
        >
            {err && (
                <ErrorCard
                    message={err}
                    actions={<button onClick={load}>再試行</button>}
                />
            )}

            {msg && (
                <Card>
                    <div style={{ fontSize: 13, opacity: 0.9 }}>{msg}</div>
                </Card>
            )}

            <Card>
                <div style={{ display: "grid", gap: 12 }}>
                    <div
                        style={{
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        <div style={{ fontWeight: 900, fontSize: 15 }}>
                            判定用プロフィール
                        </div>

                        <div
                            style={{
                                marginLeft: "auto",
                                display: "flex",
                                gap: 8,
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
                        </div>
                    </div>

                    <div
                        style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.6 }}
                    >
                        My選挙の対象判定に使用します。本人認証済みの場合は市民情報が優先され、ここは編集できません。
                    </div>

                    {identityLocked && (
                        <div style={{ fontSize: 12, opacity: 0.75 }}>
                            ※
                            本人認証済み（市民情報由来）のため、自己申告プロフィールは編集できません。
                        </div>
                    )}

                    <label style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 800 }}>
                            生年月日
                        </div>
                        <input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            disabled={identityLocked || saving}
                            style={{
                                padding: "10px 12px",
                                borderRadius: 10,
                                border: "1px solid #e5e5e5",
                                background:
                                    identityLocked || saving
                                        ? "#fafafa"
                                        : "#fff",
                            }}
                        />
                    </label>

                    <div style={{ display: "grid", gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 800 }}>
                            住所
                        </div>
                        <AddressInput
                            prefCode={prefCode}
                            cityCode={cityCode}
                            onChangePref={setPrefCode}
                            onChangeCity={setCityCode}
                            disabled={identityLocked || saving}
                        />
                        <div
                            style={{
                                fontSize: 12,
                                opacity: 0.7,
                                lineHeight: 1.6,
                            }}
                        >
                            ※ 郵便番号 or 選択で入力できます（保存は prefCode /
                            cityCode）
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
                            onClick={onSave}
                            disabled={!canSave}
                            title={cannotSaveReason ?? undefined}
                        >
                            {saving ? "保存中..." : "保存"}
                        </button>

                        {cannotSaveReason && (
                            <span style={{ fontSize: 12, opacity: 0.7 }}>
                                保存不可: {cannotSaveReason}
                            </span>
                        )}
                    </div>
                </div>
            </Card>

            {isDev && (
                <DevDebug
                    value={{
                        fromState: state.from ?? null,
                        self,
                        backTo,
                        profile,
                        loading,
                        saving,
                        birthDate,
                        prefCode,
                        cityCode,
                        err,
                        msg,
                    }}
                />
            )}
        </Page>
    );
}
