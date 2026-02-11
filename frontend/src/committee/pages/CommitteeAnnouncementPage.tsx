// frontend/src/committee/pages/CommitteeAnnouncementPage.tsx
import React, { useEffect, useMemo, useState } from "react";
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
    return a === "ADMIN" ? "システム管理者から" : "選挙管理委員会から";
}

function toIsoFromDatetimeLocal(v: string): string | null {
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

type NoticeStatus = "ACTIVE" | "FUTURE" | "EXPIRED" | "UNKNOWN";

function noticeStatus(n: PublicNotice): NoticeStatus {
    const now = Date.now();
    const pub = new Date(n.publishedAt).getTime();
    const exp = n.expiresAt ? new Date(n.expiresAt).getTime() : null;

    if (!Number.isFinite(pub)) return "UNKNOWN";
    if (pub > now) return "FUTURE";
    if (exp != null && Number.isFinite(exp) && exp <= now) return "EXPIRED";
    return "ACTIVE";
}

function statusLabel(s: NoticeStatus) {
    if (s === "ACTIVE") return "公開中";
    if (s === "FUTURE") return "未公開";
    if (s === "EXPIRED") return "期限切れ";
    return "不明";
}

function statusStyle(s: NoticeStatus): React.CSSProperties {
    if (s === "ACTIVE") return { opacity: 1 };
    if (s === "FUTURE") return { opacity: 0.72 };
    if (s === "EXPIRED")
        return { opacity: 0.6, textDecoration: "line-through" };
    return { opacity: 0.7 };
}

type TabKey = "BANNER" | "LIST";

const ui = {
    row: {
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
    } as const,
    col: { display: "flex", flexDirection: "column", gap: 10 } as const,
    box: {
        border: "1px solid #ddd",
        borderRadius: 10,
        padding: 12,
        background: "#fff",
    } as const,
    btn: {
        border: "1px solid #ccc",
        background: "#fff",
        cursor: "pointer",
        padding: "8px 10px",
        borderRadius: 8,
        fontWeight: 700,
    } as const,
    btnSm: {
        border: "1px solid #ccc",
        background: "#fff",
        cursor: "pointer",
        padding: "6px 10px",
        borderRadius: 8,
        fontWeight: 700,
        fontSize: 13,
    } as const,
    input: {
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        background: "#fff",
    } as const,
    label: { fontSize: 13, opacity: 0.75 } as const,
    badge: {
        border: "1px solid #ccc",
        borderRadius: 999,
        padding: "2px 8px",
        fontSize: 12,
        display: "inline-block",
    } as const,
};

export function CommitteeAnnouncementPage() {
    const [tab, setTab] = useState<TabKey>("LIST");
    const [err, setErr] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    const [bannerBusy, setBannerBusy] = useState(false);
    const [enabled, setEnabled] = useState(true);
    const [actor, setActor] =
        useState<SystemAnnouncement["actor"]>("COMMITTEE");
    const [message, setMessage] = useState("");

    const [listBusy, setListBusy] = useState(false);
    const [notices, setNotices] = useState<PublicNotice[]>([]);
    const [nTitle, setNTitle] = useState("");
    const [nBody, setNBody] = useState("");
    const [nPinned, setNPinned] = useState(false);
    const [nPublishedAt, setNPublishedAt] = useState(nowDatetimeLocal());
    const [nExpiresAt, setNExpiresAt] = useState<string>("");

    const preview = useMemo(() => {
        if (!enabled) return "（非表示）";
        const head = `[${actorLabel(actor)}]`;
        return `${head}\n${message}`.trim();
    }, [enabled, actor, message]);

    const sortedNotices = useMemo(() => {
        const cp = [...notices];
        cp.sort((a, b) => {
            const ap = a.pinned ? 1 : 0;
            const bp = b.pinned ? 1 : 0;
            if (ap !== bp) return bp - ap;
            const at = new Date(a.publishedAt).getTime();
            const bt = new Date(b.publishedAt).getTime();
            return (
                (Number.isFinite(bt) ? bt : 0) - (Number.isFinite(at) ? at : 0)
            );
        });
        return cp;
    }, [notices]);

    const counts = useMemo(() => {
        let active = 0,
            future = 0,
            expired = 0,
            unknown = 0;
        for (const n of notices) {
            const s = noticeStatus(n);
            if (s === "ACTIVE") active++;
            else if (s === "FUTURE") future++;
            else if (s === "EXPIRED") expired++;
            else unknown++;
        }
        return { active, future, expired, unknown, total: notices.length };
    }, [notices]);

    function flashInfo(msg: string) {
        setInfo(msg);
        window.setTimeout(() => setInfo(null), 2000);
    }

    function clearMessages() {
        setErr(null);
        setInfo(null);
    }

    async function loadBanner() {
        setBannerBusy(true);
        setErr(null);
        try {
            const a = await fetchCommitteeAnnouncement();
            setEnabled(!!a.enabled);
            setActor(a.actor);
            setMessage(a.message ?? "");
        } catch (e: any) {
            setErr(String(e?.message ?? e));
        } finally {
            setBannerBusy(false);
        }
    }

    async function saveBanner() {
        setBannerBusy(true);
        setErr(null);
        try {
            const msg = message.trim();
            if (enabled && !msg) {
                setErr("本文が空です（非表示にするならチェックを外してOK）");
                return;
            }

            await updateCommitteeAnnouncement({
                enabled,
                actor,
                message: msg,
            });

            flashInfo("バナーを保存しました");
            await loadBanner();
        } catch (e: any) {
            setErr(String(e?.message ?? e));
        } finally {
            setBannerBusy(false);
        }
    }

    async function loadNotices() {
        setListBusy(true);
        setErr(null);
        try {
            const items = await fetchCommitteeNotices(200);
            setNotices(items ?? []);
        } catch (e: any) {
            setErr(String(e?.message ?? e));
        } finally {
            setListBusy(false);
        }
    }

    async function addNotice() {
        setListBusy(true);
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

            await createCommitteeNotice({
                title,
                body,
                pinned: nPinned,
                publishedAt: publishedIso,
                expiresAt: expiresIso,
            });

            flashInfo("通知を追加しました");

            setNTitle("");
            setNBody("");
            setNPinned(false);
            setNPublishedAt(nowDatetimeLocal());
            setNExpiresAt("");

            await loadNotices();
        } catch (e: any) {
            setErr(String(e?.message ?? e));
        } finally {
            setListBusy(false);
        }
    }

    async function removeNotice(id: string) {
        if (!confirm("この通知を削除しますか？")) return;
        setListBusy(true);
        setErr(null);
        try {
            await deleteCommitteeNotice(id);
            flashInfo("通知を削除しました");
            await loadNotices();
        } catch (e: any) {
            setErr(String(e?.message ?? e));
        } finally {
            setListBusy(false);
        }
    }

    useEffect(() => {
        loadBanner();
        loadNotices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const anyBusy = bannerBusy || listBusy;

    return (
        <Page title="選管：お知らせ">
            {(err || info) && (
                <Card>
                    <div style={ui.box}>
                        {err ? (
                            <>
                                <div style={{ fontWeight: 900 }}>Error</div>
                                <div
                                    style={{
                                        marginTop: 6,
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {err}
                                </div>

                                {String(err).includes("404") && (
                                    <div
                                        style={{
                                            marginTop: 10,
                                            fontSize: 12,
                                            opacity: 0.7,
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        ヒント: Network で{" "}
                                        <b>/api/committee/announcement</b> に
                                        404 が出てるなら、Backend の Controller
                                        のパスと Front の URL
                                        がズレてる可能性が高い。
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div style={{ fontWeight: 900 }}>OK</div>
                                <div
                                    style={{
                                        marginTop: 6,
                                        whiteSpace: "pre-wrap",
                                        opacity: 0.85,
                                    }}
                                >
                                    {info}
                                </div>
                            </>
                        )}
                    </div>
                </Card>
            )}

            <Card>
                <div style={ui.row}>
                    <div style={{ fontWeight: 900 }}>操作</div>
                    <div style={{ ...ui.row, marginLeft: "auto" }}>
                        <button
                            style={{
                                ...ui.btnSm,
                                fontWeight: tab === "LIST" ? 900 : 700,
                            }}
                            onClick={() => {
                                clearMessages();
                                setTab("LIST");
                            }}
                            disabled={anyBusy}
                        >
                            お知らせ一覧
                        </button>
                        <button
                            style={{
                                ...ui.btnSm,
                                fontWeight: tab === "BANNER" ? 900 : 700,
                            }}
                            onClick={() => {
                                clearMessages();
                                setTab("BANNER");
                            }}
                            disabled={anyBusy}
                        >
                            単発バナー
                        </button>
                    </div>
                </div>
            </Card>

            {tab === "BANNER" && (
                <Card>
                    <div style={ui.col}>
                        <div style={ui.row}>
                            <div style={{ fontWeight: 900 }}>
                                公開ページ：単発バナー
                            </div>
                            <div style={{ ...ui.row, marginLeft: "auto" }}>
                                <button
                                    style={ui.btnSm}
                                    onClick={loadBanner}
                                    disabled={bannerBusy}
                                >
                                    再読み込み
                                </button>
                                <button
                                    style={ui.btnSm}
                                    onClick={saveBanner}
                                    disabled={bannerBusy}
                                >
                                    保存
                                </button>
                            </div>
                        </div>

                        <label style={{ ...ui.row, fontSize: 13 }}>
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                                disabled={bannerBusy}
                            />
                            公開ページに表示する
                        </label>

                        <div style={ui.col}>
                            <div style={ui.label}>発信者</div>
                            <select
                                style={ui.input}
                                value={actor}
                                onChange={(e) =>
                                    setActor(
                                        e.target
                                            .value as SystemAnnouncement["actor"],
                                    )
                                }
                                disabled={bannerBusy}
                            >
                                <option value="ADMIN">
                                    [システム管理者から]
                                </option>
                                <option value="COMMITTEE">
                                    [選挙管理委員会から]
                                </option>
                            </select>
                        </div>

                        <div style={ui.col}>
                            <div style={ui.label}>本文（手動入力）</div>
                            <textarea
                                style={{ ...ui.input, resize: "vertical" }}
                                rows={6}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={bannerBusy}
                                placeholder={
                                    enabled
                                        ? "例）投票開始は 2/10 09:00 からです。\nご協力をお願いします。"
                                        : "（非表示中）"
                                }
                            />
                            <div style={{ fontSize: 12, opacity: 0.6 }}>
                                ※改行OK（Public側は pre-wrap 推奨）
                            </div>
                        </div>

                        <div style={ui.box}>
                            <div style={{ fontWeight: 900 }}>プレビュー</div>
                            <div
                                style={{
                                    marginTop: 6,
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {preview}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {tab === "LIST" && (
                <Card>
                    <div style={ui.col}>
                        <div style={ui.row}>
                            <div style={{ fontWeight: 900 }}>
                                公開ページ：お知らせ一覧
                            </div>

                            <div style={{ ...ui.row, marginLeft: "auto" }}>
                                <span style={{ fontSize: 12, opacity: 0.75 }}>
                                    公開中: {counts.active} / 未公開:{" "}
                                    {counts.future} / 期限切れ: {counts.expired}
                                    {counts.unknown > 0
                                        ? ` / 不明: ${counts.unknown}`
                                        : ""}
                                    {" / "}合計: {counts.total}
                                </span>

                                <button
                                    style={ui.btnSm}
                                    onClick={loadNotices}
                                    disabled={listBusy}
                                >
                                    再読み込み
                                </button>
                            </div>
                        </div>

                        <div style={ui.box}>
                            <div style={ui.row}>
                                <div style={{ fontWeight: 900, fontSize: 13 }}>
                                    新規追加
                                </div>

                                <button
                                    style={{ ...ui.btnSm, marginLeft: "auto" }}
                                    onClick={() => {
                                        setNTitle("");
                                        setNBody("");
                                        setNPinned(false);
                                        setNPublishedAt(nowDatetimeLocal());
                                        setNExpiresAt("");
                                        flashInfo("フォームをリセットしました");
                                    }}
                                    disabled={listBusy}
                                    type="button"
                                >
                                    フォームリセット
                                </button>
                            </div>

                            <div style={{ marginTop: 10, ...ui.col }}>
                                <label style={ui.col}>
                                    <span style={ui.label}>タイトル</span>
                                    <input
                                        style={ui.input}
                                        value={nTitle}
                                        onChange={(e) =>
                                            setNTitle(e.target.value)
                                        }
                                        disabled={listBusy}
                                        placeholder="例）投票期間のお知らせ"
                                    />
                                </label>

                                <label style={ui.col}>
                                    <span style={ui.label}>本文</span>
                                    <textarea
                                        style={{
                                            ...ui.input,
                                            resize: "vertical",
                                        }}
                                        rows={5}
                                        value={nBody}
                                        onChange={(e) =>
                                            setNBody(e.target.value)
                                        }
                                        disabled={listBusy}
                                        placeholder={
                                            "例）\n投票期間は 2/10 09:00〜2/12 18:00 です。\n時間に余裕をもって投票してください。"
                                        }
                                    />
                                </label>

                                <div style={ui.row}>
                                    <label style={{ ...ui.row, fontSize: 13 }}>
                                        <input
                                            type="checkbox"
                                            checked={nPinned}
                                            onChange={(e) =>
                                                setNPinned(e.target.checked)
                                            }
                                            disabled={listBusy}
                                        />
                                        固定（上に表示）
                                    </label>

                                    <label style={{ ...ui.row, fontSize: 13 }}>
                                        <span style={ui.label}>公開日時</span>
                                        <input
                                            type="datetime-local"
                                            style={ui.input}
                                            value={nPublishedAt}
                                            onChange={(e) =>
                                                setNPublishedAt(e.target.value)
                                            }
                                            disabled={listBusy}
                                        />
                                    </label>

                                    <label style={{ ...ui.row, fontSize: 13 }}>
                                        <span style={ui.label}>
                                            期限（任意）
                                        </span>
                                        <input
                                            type="datetime-local"
                                            style={ui.input}
                                            value={nExpiresAt}
                                            onChange={(e) =>
                                                setNExpiresAt(e.target.value)
                                            }
                                            disabled={listBusy}
                                        />
                                        <button
                                            style={ui.btnSm}
                                            onClick={() => setNExpiresAt("")}
                                            disabled={listBusy}
                                            type="button"
                                        >
                                            クリア
                                        </button>
                                    </label>
                                </div>

                                <div style={ui.row}>
                                    <button
                                        style={ui.btn}
                                        onClick={addNotice}
                                        disabled={listBusy}
                                    >
                                        追加
                                    </button>
                                </div>

                                <div style={{ fontSize: 12, opacity: 0.6 }}>
                                    ※
                                    Publicに出ない場合：公開日時が未来（未公開）/
                                    期限切れ / Public側が未更新 のどれかが多い
                                </div>
                            </div>
                        </div>

                        {sortedNotices.length === 0 ? (
                            <div style={{ fontSize: 13, opacity: 0.7 }}>
                                現在、お知らせはありません。
                            </div>
                        ) : (
                            <div style={{ display: "grid", gap: 10 }}>
                                {sortedNotices.map((n) => {
                                    const st = noticeStatus(n);
                                    return (
                                        <div
                                            key={n.id}
                                            style={{
                                                ...ui.box,
                                                ...statusStyle(st),
                                            }}
                                        >
                                            <div style={ui.row}>
                                                <div style={ui.row}>
                                                    {n.pinned && (
                                                        <span style={ui.badge}>
                                                            固定
                                                        </span>
                                                    )}
                                                    <span style={ui.badge}>
                                                        {statusLabel(st)}
                                                    </span>
                                                    <div
                                                        style={{
                                                            fontWeight: 900,
                                                        }}
                                                    >
                                                        {n.title}
                                                    </div>
                                                </div>

                                                <button
                                                    style={{
                                                        ...ui.btnSm,
                                                        marginLeft: "auto",
                                                    }}
                                                    onClick={() =>
                                                        removeNotice(n.id)
                                                    }
                                                    disabled={listBusy}
                                                >
                                                    削除
                                                </button>
                                            </div>

                                            <div
                                                style={{
                                                    marginTop: 8,
                                                    whiteSpace: "pre-wrap",
                                                    fontSize: 13,
                                                    opacity: 0.9,
                                                }}
                                            >
                                                {n.body}
                                            </div>

                                            <div
                                                style={{
                                                    marginTop: 8,
                                                    fontSize: 12,
                                                    opacity: 0.65,
                                                }}
                                            >
                                                公開:{" "}
                                                {formatLocal(n.publishedAt)}
                                                {n.expiresAt
                                                    ? ` / 期限: ${formatLocal(
                                                          n.expiresAt,
                                                      )}`
                                                    : ""}
                                                {n.updatedAt
                                                    ? ` / 更新: ${formatLocal(
                                                          n.updatedAt,
                                                      )}`
                                                    : ""}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </Card>
            )}

            <DevDebug
                value={{
                    tab,
                    banner: { enabled, actor, message },
                    noticesCount: notices.length,
                    counts,
                    busy: { bannerBusy, listBusy },
                }}
            />
        </Page>
    );
}
