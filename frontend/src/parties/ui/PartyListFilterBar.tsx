import type { Dispatch, SetStateAction } from "react";
import { FilterBar } from "../../shared/ui/FilterBar";
import type { PartySortKey } from "../model/partyListView";

export function PartyListFilterBar(props: {
    q: string;
    setQ: Dispatch<SetStateAction<string>>;
    sortKey: PartySortKey;
    setSortKey: Dispatch<SetStateAction<PartySortKey>>;
}) {
    const { q, setQ, sortKey, setSortKey } = props;

    return (
        <FilterBar
            value={q}
            onChange={setQ}
            placeholder="政党名 / 略称で検索"
            right={
                <label
                    style={{
                        display: "inline-flex",
                        gap: 6,
                        alignItems: "center",
                    }}
                >
                    <span style={{ fontSize: 12, opacity: 0.8 }}>並び替え</span>
                    <select
                        value={sortKey}
                        onChange={(e) =>
                            setSortKey(e.target.value as PartySortKey)
                        }
                    >
                        <option value="TITLE">名称</option>
                        <option value="SHORT_NAME">略称</option>
                    </select>
                </label>
            }
        />
    );
}
