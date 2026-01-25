// frontend/src/committee/pages/CommitteeElectionsPage.tsx
import { useCallback, useEffect, useState } from "react";
import { ElectionListView } from "../../shared/components/ElectionListView";
import {
    fetchCommitteeElections,
    type CommitteeElectionListItem,
} from "../api/elections";

export function CommitteeElectionsPage() {
    const [items, setItems] = useState<CommitteeElectionListItem[] | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const load = useCallback(async () => {
        setError(null);
        setIsLoading(true);
        try {
            setItems(await fetchCommitteeElections());
        } catch (e: any) {
            setError(e?.response?.data?.message ?? "Failed to load");
            setItems([]); // 失敗時は空配列で表示を成立させる
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <ElectionListView
            title="担当選挙一覧"
            items={items}
            error={error}
            isLoading={isLoading}
            onReload={load}
            detailsHref={(e) => `/committee/elections/${e.electionId}`}
        />
    );
}
