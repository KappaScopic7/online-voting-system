import type { CandidateItem } from "./candidateTypes";

export type ElectionMeta = {
    title: string;
    startsAt?: string;
    endsAt?: string;
    status?: string;
};

export type PersonItem = {
    personKey: string;
    candidateKey?: string | null;
    name: string;
    title: string;
    age?: number | null;
    party: CandidateItem["party"] | null;
    electionsCount: number;
    repElectionId: string;
    repCandidateId: string;
    repSortOrder: number;
};

function readCandidateKey(c: CandidateItem): string | null {
    const k = (c as any)?.candidateKey;
    return typeof k === "string" && k.trim() ? k.trim() : null;
}

function readAge(c: CandidateItem): number | null {
    const a = (c as any)?.age;
    return typeof a === "number" ? a : null;
}

function buildPersonKey(c: CandidateItem): {
    personKey: string;
    candidateKey?: string | null;
} {
    const ck = readCandidateKey(c);
    if (ck) return { personKey: `ck:${ck}`, candidateKey: ck };

    const pk = c.party?.partyKey ?? "ind";
    return { personKey: `f:${c.name}|${c.title}|${pk}`, candidateKey: null };
}

export function filterCandidates(
    items: CandidateItem[] | null,
    q: string,
): CandidateItem[] | null {
    if (!items) return null;
    const qq = q.trim().toLowerCase();
    if (!qq) return items;

    return items.filter((c) => {
        const name = (c.name ?? "").toLowerCase();
        const title = (c.title ?? "").toLowerCase();
        return name.includes(qq) || title.includes(qq);
    });
}

export function toPeople(
    filtered: CandidateItem[] | null,
): PersonItem[] | null {
    if (!filtered) return null;

    const map = new Map<string, CandidateItem[]>();
    for (const c of filtered) {
        const { personKey } = buildPersonKey(c);
        if (!map.has(personKey)) map.set(personKey, []);
        map.get(personKey)!.push(c);
    }

    const list: PersonItem[] = [];
    for (const [personKey, group] of map.entries()) {
        const rep = [...group].sort((a, b) => a.sortOrder - b.sortOrder)[0];
        const { candidateKey: ck } = buildPersonKey(rep);

        list.push({
            personKey,
            candidateKey: ck ?? undefined,
            name: rep.name,
            title: rep.title ?? "",
            age: readAge(rep),
            party: rep.party ?? null,
            electionsCount: group.length,
            repElectionId: rep.electionId,
            repCandidateId: rep.id,
            repSortOrder: rep.sortOrder,
        });
    }

    list.sort((a, b) => {
        const pa = a.party?.shortName ?? "無所属";
        const pb = b.party?.shortName ?? "無所属";
        const pcmp = pa.localeCompare(pb, "ja");
        if (pcmp !== 0) return pcmp;
        return a.name.localeCompare(b.name, "ja");
    });

    return list;
}

export function groupByElection(
    filtered: CandidateItem[] | null,
    electionMetaById: Record<string, ElectionMeta>,
) {
    if (!filtered) return null;

    const m = new Map<string, CandidateItem[]>();
    for (const c of filtered) {
        const key = c.electionId;
        if (!m.has(key)) m.set(key, []);
        m.get(key)!.push(c);
    }

    const entries = Array.from(m.entries()).map(([id, list]) => ({
        electionId: id,
        list: [...list].sort((a, b) => a.sortOrder - b.sortOrder),
    }));

    entries.sort((a, b) => {
        const ta = electionMetaById[a.electionId]?.title ?? a.electionId;
        const tb = electionMetaById[b.electionId]?.title ?? b.electionId;
        return ta.localeCompare(tb, "ja");
    });

    return entries;
}
