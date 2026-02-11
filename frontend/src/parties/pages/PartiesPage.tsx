import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchParties } from "../api/parties";
import type { PartyListItem } from "../model/partyTypes";

import { Page, Card, DevDebug } from "../../shared/ui/page";
import { FilterBar } from "../../shared/ui/FilterBar";
import { ErrorCard } from "../../shared/ui/ErrorCard";
import { useAsyncLoad } from "../../shared/hooks/useAsyncLoad";
import { useFromBackTo } from "../../shared/routes/useFromBackTo";
import { CollapsibleFilter } from "../../shared/ui/CollapsibleFilter";

import { PartyCard } from "../ui/PartyCard";

export function PartiesPage() {
    // ✅ 共通：from/backTo/self
    const { self, backTo } = useFromBackTo("/");

    const {
        data: items,
        error,
        isLoading,
        run,
    } = useAsyncLoad<PartyListItem[]>(fetchParties);

    const [q, setQ] = useState("");

    useEffect(() => {
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        if (!items) return null;

        const keyword = q.trim().toLowerCase();
        if (!keyword) return items;

        return items.filter((p) => {
            const name = (p.name ?? "").toLowerCase();
            const shortName = (p.shortName ?? "").toLowerCase();
            const key = (p.partyKey ?? "").toLowerCase();
            const desc = (p.description ?? "").toLowerCase();
            return (
                name.includes(keyword) ||
                shortName.includes(keyword) ||
                key.includes(keyword) ||
                desc.includes(keyword)
            );
        });
    }, [items, q]);

    const totalCount = items?.length ?? 0;
    const filteredCount = filtered?.length ?? 0;

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>政党一覧</h1>}
            actions={
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <Link to={backTo}>← 戻る</Link>

                    <button
                        onClick={run}
                        disabled={isLoading}
                        style={{ marginLeft: 8 }}
                    >
                        {isLoading ? "読み込み中..." : "再読み込み"}
                    </button>
                </div>
            }
            maxWidth={760}
        >
            {error && (
                <ErrorCard
                    message={error}
                    actions={<button onClick={run}>再試行</button>}
                />
            )}

            <CollapsibleFilter
                title="絞り込み"
                defaultOpen={!!q.trim()}
                right={
                    <span style={{ whiteSpace: "nowrap" }}>
                        表示 <b>{filteredCount}</b> 件（全 <b>{totalCount}</b>{" "}
                        件）
                    </span>
                }
            >
                <FilterBar
                    value={q}
                    onChange={setQ}
                    placeholder="検索（政党名 / 略称 / キー / 説明）"
                    disabled={isLoading}
                />
            </CollapsibleFilter>

            {filtered === null ? (
                <Card>読み込み中…</Card>
            ) : filtered.length === 0 ? (
                <Card>
                    <p style={{ margin: 0, opacity: 0.8 }}>
                        {totalCount === 0
                            ? "政党がありません"
                            : "該当する政党が見つかりません"}
                    </p>
                </Card>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gap: 12,
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(240px, 1fr))",
                        alignItems: "stretch",
                    }}
                >
                    {filtered.map((p) => (
                        <PartyCard key={p.partyKey} p={p} from={self} />
                    ))}
                </div>
            )}

            <DevDebug
                value={{
                    items,
                    filteredCount,
                    totalCount,
                    error,
                    isLoading,
                    backTo,
                    self,
                    q,
                }}
            />
        </Page>
    );
}
