import { useEffect, useMemo, useState } from "react";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import type { SystemAnnouncement } from "../api/announcement";
import {
    fetchCommitteeAnnouncement,
    updateCommitteeAnnouncement,
} from "../api/announcement";

function actorLabel(a: SystemAnnouncement["actor"]) {
    return a === "SYSTEM_ADMIN" ? "システム管理者から" : "選挙管理委員会から";
}

export function CommitteeAnnouncementPage() {
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [enabled, setEnabled] = useState(true);
    const [actor, setActor] =
        useState<SystemAnnouncement["actor"]>("COMMITTEE");
    const [message, setMessage] = useState("");

    const preview = useMemo(() => {
        if (!enabled) return "（非表示）";
        const head = `[${actorLabel(actor)}]`;
        return `${head} ${message}`.trim();
    }, [enabled, actor, message]);

    async function load() {
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

    async function save() {
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
            await load();
        } catch (e: any) {
            setErr(String(e?.message ?? e));
        } finally {
            setBusy(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Page title="選管：お知らせ">
            <Card>
                <div className="flex flex-col gap-3">
                    {err && (
                        <div className="rounded-md border p-2 text-sm">
                            <div className="font-bold">Error</div>
                            <div className="break-all whitespace-pre-wrap">
                                {err}
                            </div>
                        </div>
                    )}

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

                    <div className="flex gap-2">
                        <button
                            className="rounded-md border px-3 py-2"
                            onClick={save}
                            disabled={busy}
                        >
                            保存
                        </button>
                        <button
                            className="rounded-md border px-3 py-2"
                            onClick={load}
                            disabled={busy}
                        >
                            再読み込み
                        </button>
                    </div>

                    <div className="rounded-md border p-2 text-sm">
                        <div className="font-bold">プレビュー</div>
                        <div className="whitespace-pre-wrap">{preview}</div>
                    </div>

                    <DevDebug value={{ enabled, actor, message }} />
                </div>
            </Card>
        </Page>
    );
}
