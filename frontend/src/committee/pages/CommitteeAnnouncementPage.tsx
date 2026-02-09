import { useEffect, useMemo, useState } from "react";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { formatLocal } from "../../shared/datetime/formatLocal";
import type { SystemAnnouncement } from "../../shared/model/announcement";
import {
    fetchCommitteeNotices,
    createCommitteeNotice,
    deleteCommitteeNotice,
    type PublicNotice,
} from "../api/notices";
import {
    fetchCommitteeAnnouncement,
    updateCommitteeAnnouncement,
} from "../api/announcement";

function actorLabel(a: SystemAnnouncement["actor"]) {
    return a === "SYSTEM_ADMIN" ? "システム管理者から" : "選挙管理委員会から";
}

function toIsoFromDatetimeLocal(v: string): string | null {
    // v: "YYYY-MM-DDTHH:mm"
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
}

function nowDatetimeLocal(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${hh}:${mm}`;
}

type NoticeStatus = "ACTIVE" | "FUTURE" | "EXPIRED";

function noticeStatus(n: PublicNotice): NoticeStatus {
    const now = Date.now();
    const pub = new Date(n.publishedAt).getTime();
    const exp = n.expiresAt ? new Date(n.expiresAt).getTime() : null;

    if (!Number.isFinite(pub)) return "FUTURE";
    if (pub > now) return "FUTURE";
    if (exp != null && Number.isFinite(exp) && exp <= now) return "EXPIRED";
    return "ACTIVE";
}

function statusLabel(s: NoticeStatus) {
    if (s === "ACTIVE") return "公開中";
    if (s === "FUTURE") return "未公開";
    return "期限切れ";
}

export function CommitteeAnnouncementPage() {
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // --- SystemAnnouncement（単発バナー） ---
    const [enabled, setEnabled] = useState(true);
    const [actor, setActor] =
        useState<SystemAnnouncement["actor"]>("COMMITTEE");
    const [message, setMessage] = useState("");

    const preview = useMemo(() => {
        if (!enabled) return "（非表示）";
        const head = `[${actorLabel(actor)}]`;
        return `${head} ${message}`.trim();
    }, [enabled, actor, message]);

    // --- PublicNotice（複数件通知） ---
    const [notices, setNotices] = useState<PublicNotice[]>([]);
    const [nTitle, setNTitle] = useState("");
    const [nBody, setNBody] = useState("");
    const [nPinned, setNPinned] = useState(false);
    const [nPublishedAt, setNPublishedAt] = useState(nowDatetimeLocal());
    const [nExpiresAt, setNExpiresAt] = useState<string>(""); // 空ならnull

    async function loadBanner() {
        setBusy(true);
        setErr(null);
        try {
            const a = await fetchCommitteeAnnouncement();
            setEnabled(!!a.enabled);
            setActor(a.actor);
            setMessage(a.message ?? "");
        } catch (e: any) {
            setErr(String(e?.message ?? e));
        } finally {
            setBusy(false);
        }
    }

    async function saveBanner() {
        setBusy(true);
        setErr(null);
        try {
            const msg = message.trim();
            if (!msg) {
                setErr("本文が空です");
                return;
            }
            await updateCommitteeAnnouncement({
                enabled,
                actor,
                message: msg,
            });
            await loadBanner();
        } catch (e: any) {
            setErr(String(e?.message ?? e));
        } finally {
            setBusy(false);
        }
    }

    async function loadNotices() {
        setBusy(true);
        setErr(null);
        try {
            const items = await fetchCommitteeNotices(200);
            setNotices(items ?? []);
        } catch (e: any) {
            setErr(String(e?.message ?? e));
        } finally {
            setBusy(false);
        }
    }

    async function addNotice() {
        setBusy(true);
        setErr(null);
        try {
            const title = nTitle.trim();
            const body = nBody.trim();
            if (!title) {
                setErr("タイトルが空です");
                return;
            }
            if (!body) {
                setErr("本文が空です");
                return;
            }

            const publishedIso = toIsoFromDatetimeLocal(nPublishedAt);
            if (!publishedIso) {
                setErr("公開日時が不正です");
                return;
            }

            const expiresIso = nExpiresAt
                ? toIsoFromDatetimeLocal(nExpiresAt)
                : null;
            if (nExpiresAt && !expiresIso) {
                setErr("期限が不正です");
                return;
            }

            const created = await createCommitteeNotice({
                title,
                body,
                pinned: nPinned,
                publishedAt: publishedIso,
                expiresAt: expiresIso,
            });

            // ✅ 追加直後は “体感” のため先頭に差し込み（その後リロードでもOK）
            setNotices((prev) => [created, ...prev]);

            // フォーム初期化
            setNTitle("");
            setNBody("");
            setNPinned(false);
            setNPublishedAt(nowDatetimeLocal());
            setNExpiresAt("");

            // ✅ サーバーの並び順/状態に合わせて同期したいなら最後にこれ
            await loadNotices();
        } catch (e: any) {
            setErr(String(e?.message ?? e));
        } finally {
            setBusy(false);
        }
    }

    async function removeNotice(id: string) {
        if (!confirm("この通知を削除しますか？")) return;
        setBusy(true);
        setErr(null);
        try {
            await deleteCommitteeNotice(id);
            await loadNotices();
        } catch (e: any) {
            setErr(String(e?.message ?? e));
        } finally {
            setBusy(false);
        }
    }

    useEffect(() => {
        loadBanner();
        loadNotices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const counts = useMemo(() => {
        let active = 0,
            future = 0,
            expired = 0;
        for (const n of notices) {
            const s = noticeStatus(n);
            if (s === "ACTIVE") active++;
            else if (s === "FUTURE") future++;
            else expired++;
        }
        return { active, future, expired, total: notices.length };
    }, [notices]);

    return (
        <Page title="選管：お知らせ">
            {/* エラー表示（共通） */}
            {err && (
                <Card>
                    <div className="rounded-md border p-2 text-sm">
                        <div className="font-bold">Error</div>
                        <div className="break-all whitespace-pre-wrap">
                            {err}
                        </div>
                        <div className="mt-1 text-xs opacity-60">
                            ※「Publicに出ない」時は、通知一覧のステータス（未公開/期限切れ）も確認してね
                        </div>
                    </div>
                </Card>
            )}

            {/* 単発バナー（SystemAnnouncement） */}
            <Card>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="font-bold">公開ページ：単発バナー</div>
                        <button
                            className="rounded-md border px-3 py-2"
                            onClick={loadBanner}
                            disabled={busy}
                        >
                            再読み込み
                        </button>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => setEnabled(e.target.checked)}
                            disabled={busy}
                        />
                        公開ページに表示する
                    </label>

                    <div className="flex flex-col gap-1">
                        <div className="text-sm opacity-70">発信者</div>
                        <select
                            className="rounded-md border p-2"
                            value={actor}
                            onChange={(e) =>
                                setActor(
                                    e.target
                                        .value as SystemAnnouncement["actor"],
                                )
                            }
                            disabled={busy}
                        >
                            <option value="SYSTEM_ADMIN">
                                [システム管理者から]
                            </option>
                            <option value="COMMITTEE">
                                [選挙管理委員会から]
                            </option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="text-sm opacity-70">
                            本文（手動入力）
                        </div>
                        <textarea
                            className="rounded-md border p-2"
                            rows={5}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={busy}
                        />
                        <div className="text-xs opacity-60">
                            ※改行OK（Public側は pre-wrap 推奨）
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <button
                            className="rounded-md border px-3 py-2"
                            onClick={saveBanner}
                            disabled={busy}
                        >
                            保存
                        </button>
                    </div>

                    <div className="rounded-md border p-2 text-sm">
                        <div className="font-bold">プレビュー</div>
                        <div className="whitespace-pre-wrap">{preview}</div>
                    </div>
                </div>
            </Card>

            {/* 複数件通知（PublicNotice） */}
            <Card>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="font-bold">
                            公開ページ：お知らせ一覧
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-xs opacity-70">
                            <span>公開中: {counts.active}</span>
                            <span>未公開: {counts.future}</span>
                            <span>期限切れ: {counts.expired}</span>
                            <span>合計: {counts.total}</span>

                            <button
                                className="rounded-md border px-3 py-2 text-sm opacity-100"
                                onClick={loadNotices}
                                disabled={busy}
                            >
                                再読み込み
                            </button>
                        </div>
                    </div>

                    {/* 追加フォーム */}
                    <div className="rounded-md border p-3">
                        <div className="font-bold text-sm">新規追加</div>

                        <div className="mt-2 flex flex-col gap-2">
                            <label className="flex flex-col gap-1">
                                <span className="text-sm opacity-70">
                                    タイトル
                                </span>
                                <input
                                    className="rounded-md border p-2"
                                    value={nTitle}
                                    onChange={(e) => setNTitle(e.target.value)}
                                    disabled={busy}
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-sm opacity-70">本文</span>
                                <textarea
                                    className="rounded-md border p-2"
                                    rows={4}
                                    value={nBody}
                                    onChange={(e) => setNBody(e.target.value)}
                                    disabled={busy}
                                />
                            </label>

                            <div className="flex gap-3 flex-wrap items-center">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={nPinned}
                                        onChange={(e) =>
                                            setNPinned(e.target.checked)
                                        }
                                        disabled={busy}
                                    />
                                    固定（上に表示）
                                </label>

                                <label className="flex items-center gap-2 text-sm">
                                    <span className="opacity-70">公開日時</span>
                                    <input
                                        type="datetime-local"
                                        className="rounded-md border p-2"
                                        value={nPublishedAt}
                                        onChange={(e) =>
                                            setNPublishedAt(e.target.value)
                                        }
                                        disabled={busy}
                                    />
                                </label>

                                <label className="flex items-center gap-2 text-sm">
                                    <span className="opacity-70">
                                        期限（任意）
                                    </span>
                                    <input
                                        type="datetime-local"
                                        className="rounded-md border p-2"
                                        value={nExpiresAt}
                                        onChange={(e) =>
                                            setNExpiresAt(e.target.value)
                                        }
                                        disabled={busy}
                                    />
                                    <button
                                        className="rounded-md border px-2 py-2 text-sm"
                                        onClick={() => setNExpiresAt("")}
                                        disabled={busy}
                                        type="button"
                                    >
                                        クリア
                                    </button>
                                </label>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                <button
                                    className="rounded-md border px-3 py-2"
                                    onClick={addNotice}
                                    disabled={busy}
                                >
                                    追加
                                </button>

                                <button
                                    className="rounded-md border px-3 py-2"
                                    onClick={() => {
                                        setNTitle("");
                                        setNBody("");
                                        setNPinned(false);
                                        setNPublishedAt(nowDatetimeLocal());
                                        setNExpiresAt("");
                                    }}
                                    disabled={busy}
                                    type="button"
                                >
                                    フォームリセット
                                </button>
                            </div>

                            <div className="text-xs opacity-60">
                                ※ Publicに出ない場合：公開日時が未来（未公開）/
                                期限切れ / Public側が未更新 のどれかが多い
                            </div>
                        </div>
                    </div>

                    {/* 一覧 */}
                    {notices.length === 0 ? (
                        <div className="text-sm opacity-60">
                            現在、お知らせはありません。
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {notices.map((n) => {
                                const st = noticeStatus(n);
                                return (
                                    <div
                                        key={n.id}
                                        className="rounded-md border p-3"
                                    >
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {n.pinned && (
                                                    <span className="rounded-full border px-2 py-0.5 text-xs">
                                                        固定
                                                    </span>
                                                )}
                                                <span
                                                    className="rounded-full border px-2 py-0.5 text-xs"
                                                    style={{
                                                        opacity:
                                                            st === "ACTIVE"
                                                                ? 1
                                                                : 0.65,
                                                    }}
                                                >
                                                    {statusLabel(st)}
                                                </span>
                                                <div className="font-bold">
                                                    {n.title}
                                                </div>
                                            </div>

                                            <button
                                                className="rounded-md border px-3 py-2 text-sm"
                                                onClick={() =>
                                                    removeNotice(n.id)
                                                }
                                                disabled={busy}
                                            >
                                                削除
                                            </button>
                                        </div>

                                        <div className="mt-2 whitespace-pre-wrap text-sm opacity-90">
                                            {n.body}
                                        </div>

                                        <div className="mt-2 text-xs opacity-60">
                                            公開: {formatLocal(n.publishedAt)}
                                            {n.expiresAt
                                                ? ` / 期限: ${formatLocal(n.expiresAt)}`
                                                : ""}
                                            {n.updatedAt
                                                ? ` / 更新: ${formatLocal(n.updatedAt)}`
                                                : ""}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Card>

            <DevDebug
                value={{
                    banner: { enabled, actor, message },
                    noticesCount: notices.length,
                    counts,
                }}
            />
        </Page>
    );
}
