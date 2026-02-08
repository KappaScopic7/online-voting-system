export type PartySortKey = "TITLE" | "SHORT_NAME";

export type PartyListControls = {
    q: string;
    sortKey: PartySortKey;
};

export function filterSortParties<
    T extends { name?: string | null; shortName?: string | null },
>(items: T[] | null, controls: PartyListControls): T[] | null {
    if (!items) return null;

    const keyword = controls.q.trim().toLowerCase();
    let arr = items.slice();

    if (keyword) {
        arr = arr.filter((p) => {
            const name = (p.name ?? "").toLowerCase();
            const short = (p.shortName ?? "").toLowerCase();
            return name.includes(keyword) || short.includes(keyword);
        });
    }

    arr.sort((a, b) => {
        if (controls.sortKey === "SHORT_NAME") {
            return (a.shortName ?? "").localeCompare(b.shortName ?? "", "ja");
        }
        return (a.name ?? "").localeCompare(b.name ?? "", "ja");
    });

    return arr;
}
