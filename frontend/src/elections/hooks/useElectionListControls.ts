import { useState } from "react";
import type {
    ElectionListControls,
    SortKey,
    StatusFilter,
} from "../model/electionListView";

export function useElectionListControls() {
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [onlyCanCast, setOnlyCanCast] = useState(false);
    const [onlyHasResult, setOnlyHasResult] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>("STATUS");

    const controls: ElectionListControls = {
        q,
        statusFilter,
        onlyCanCast,
        onlyHasResult,
        sortKey,
    };

    return {
        controls,
        bind: {
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
        },
    };
}
