import type { Dispatch, SetStateAction } from "react";
import { FilterBar } from "../../shared/ui/FilterBar";
import type { SortKey, StatusFilter } from "../model/electionListView";

export function ElectionListFilterBar(props: {
    q: string;
    setQ: Dispatch<SetStateAction<string>>;
    statusFilter: StatusFilter;
    setStatusFilter: Dispatch<SetStateAction<StatusFilter>>;
    onlyCanCast: boolean;
    setOnlyCanCast: Dispatch<SetStateAction<boolean>>;
    onlyHasResult: boolean;
    setOnlyHasResult: Dispatch<SetStateAction<boolean>>;
    sortKey: SortKey;
    setSortKey: Dispatch<SetStateAction<SortKey>>;
}) {
    const {
        q,
        setQ,
        statusFilter,
        setStatusFilter,
        onlyCanCast,
        setOnlyCanCast,
        onlyHasResult,
        setOnlyHasResult,
        sortKey,
        setSortKey,
    } = props;

    return (
        <FilterBar
            value={q}
            onChange={setQ}
            placeholder="タイトル検索"
            right={
                <>
                    <label
                        style={{
                            display: "inline-flex",
                            gap: 6,
                            alignItems: "center",
                        }}
                    >
                        <span style={{ fontSize: 12, opacity: 0.8 }}>状態</span>
                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value as StatusFilter)
                            }
                        >
                            <option value="ALL">すべて</option>
                            <option value="ONGOING">開催中</option>
                            <option value="UPCOMING">予定</option>
                            <option value="ENDED">終了</option>
                        </select>
                    </label>

                    <label
                        style={{
                            display: "inline-flex",
                            gap: 6,
                            alignItems: "center",
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={onlyCanCast}
                            onChange={(e) => setOnlyCanCast(e.target.checked)}
                        />
                        <span style={{ fontSize: 12, opacity: 0.8 }}>
                            投票可能のみ
                        </span>
                    </label>

                    <label
                        style={{
                            display: "inline-flex",
                            gap: 6,
                            alignItems: "center",
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={onlyHasResult}
                            onChange={(e) => setOnlyHasResult(e.target.checked)}
                        />
                        <span style={{ fontSize: 12, opacity: 0.8 }}>
                            結果ありのみ
                        </span>
                    </label>

                    <label
                        style={{
                            display: "inline-flex",
                            gap: 6,
                            alignItems: "center",
                        }}
                    >
                        <span style={{ fontSize: 12, opacity: 0.8 }}>
                            並び替え
                        </span>
                        <select
                            value={sortKey}
                            onChange={(e) =>
                                setSortKey(e.target.value as SortKey)
                            }
                        >
                            <option value="STATUS">状態（開催中優先）</option>
                            <option value="STARTS_AT">開始日時</option>
                            <option value="ENDS_AT">終了日時</option>
                            <option value="TITLE">タイトル</option>
                        </select>
                    </label>
                </>
            }
        />
    );
}
