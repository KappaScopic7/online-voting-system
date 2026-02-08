import { statusRank } from "../../shared/elections/format";

export type StatusFilter = "ALL" | "UPCOMING" | "ONGOING" | "ENDED";
export type SortKey = "STATUS" | "STARTS_AT" | "ENDS_AT" | "TITLE";

export type ElectionListControls = {
    q: string;
    statusFilter: StatusFilter;
    onlyCanCast: boolean;
    onlyHasResult: boolean;
    sortKey: SortKey;
};

export function filterSortElections<
    T extends {
        title?: string | null;
        status: string;
        canCast?: boolean;
        hasResult?: boolean;
        startsAt?: string | null;
        endsAt?: string | null;
    },
>(items: T[] | null, controls: ElectionListControls): T[] | null {
    if (!items) return null;

    const keyword = controls.q.trim().toLowerCase();
    let arr = items.slice();

    if (controls.statusFilter !== "ALL")
        arr = arr.filter((e) => e.status === controls.statusFilter);

    if (controls.onlyCanCast) arr = arr.filter((e) => !!e.canCast);
    if (controls.onlyHasResult) arr = arr.filter((e) => !!e.hasResult);

    if (keyword) {
        arr = arr.filter((e) =>
            (e.title ?? "").toLowerCase().includes(keyword),
        );
    }

    arr.sort((a, b) => {
        if (controls.sortKey === "STATUS") {
            const r = statusRank(a.status as any) - statusRank(b.status as any);
            if (r !== 0) return r;
            return (a.startsAt ?? "").localeCompare(b.startsAt ?? "");
        }
        if (controls.sortKey === "STARTS_AT")
            return (a.startsAt ?? "").localeCompare(b.startsAt ?? "");
        if (controls.sortKey === "ENDS_AT")
            return (a.endsAt ?? "").localeCompare(b.endsAt ?? "");
        return (a.title ?? "").localeCompare(b.title ?? "", "ja");
    });

    return arr;
}
