const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

import type { ElectionStatus } from '../domain/election';

export type LoginResponse = {
    accessToken: string;
    tokenType: string;
};

export type MyElection = {
    electionId: number;
    code: string;
    name: string;
    districtName: string;
    status: ElectionStatus;
    startsAt: string;
    endsAt: string;
};

export type ElectionDetail = {
    id: number;
    code: string;
    name: string;
    description: string;
    districtName: string;
    status: ElectionStatus;
    startsAt: string;
    endsAt: string;
};

export type Candidate = {
    id: number;
    name: string;
    partyName: string | null;
    profile: string | null;
};

export type MyVote = {
    candidateId: number;
    candidateName: string;
    partyName: string | null;
};

export type ElectionResultItem = {
    candidateId: number;
    candidateName: string;
    partyName: string | null;
    voteCount: number;
};

export type VoteHistoryRow = {
    electionId: number;
    electionName: string;
    electionStatus: ElectionStatus;
    votedAt: string;
    candidateName: string;
    partyName: string | null;
};

export type IdentityStatus = {
    verified: boolean;
    verifiedAt: string | null;
};

export type VerifyIdentityRequest = {
    cardId: string;
    pin: string;
};

// ---- error model ----
export class ApiError extends Error {
    readonly status: number;
    readonly url: string;

    constructor(args: { status: number; message: string; url: string }) {
        super(args.message);
        this.name = 'ApiError';
        this.status = args.status;
        this.url = args.url;
    }
}

function isApiError(e: unknown): e is ApiError {
    return e instanceof ApiError;
}

async function readErrorMessage(res: Response): Promise<string> {
    // APIが text/plain を返す想定を維持しつつ、JSONにも一応対応
    const contentType = res.headers.get('content-type') ?? '';
    try {
        if (contentType.includes('application/json')) {
            const data = await res.json().catch(() => null);
            const msg =
                data &&
                typeof data === 'object' &&
                'message' in data &&
                typeof (data as any).message === 'string'
                    ? (data as any).message
                    : '';
            return msg || res.statusText || 'リクエストに失敗しました';
        }
        const text = await res.text().catch(() => '');
        return text || res.statusText || 'リクエストに失敗しました';
    } catch {
        return res.statusText || 'リクエストに失敗しました';
    }
}

type RequestOptions = {
    method: 'GET' | 'POST';
    path: string;
    token?: string;
    body?: unknown;
    acceptJson?: boolean;
    expectedStatus?: number | number[];
};

function normalizeExpected(expected?: number | number[]): number[] | null {
    if (!expected) return null;
    return Array.isArray(expected) ? expected : [expected];
}

async function requestJson<T>(opt: RequestOptions): Promise<T> {
    const url = `${API_BASE}${opt.path}`;
    const headers: Record<string, string> = {};
    if (opt.token) headers.Authorization = `Bearer ${opt.token}`;
    headers.Accept = 'application/json';
    if (opt.body !== undefined) headers['Content-Type'] = 'application/json';

    const res = await fetch(url, {
        method: opt.method,
        headers,
        body: opt.body !== undefined ? JSON.stringify(opt.body) : undefined,
    });

    const expected = normalizeExpected(opt.expectedStatus);
    if (expected && !expected.includes(res.status)) {
        const msg = await readErrorMessage(res);
        throw new ApiError({ status: res.status, message: msg, url });
    }

    if (!res.ok) {
        const msg = await readErrorMessage(res);
        throw new ApiError({ status: res.status, message: msg, url });
    }

    return res.json();
}

async function requestVoid(opt: RequestOptions): Promise<void> {
    const url = `${API_BASE}${opt.path}`;
    const headers: Record<string, string> = {};
    if (opt.token) headers.Authorization = `Bearer ${opt.token}`;
    if (opt.body !== undefined) headers['Content-Type'] = 'application/json';

    const res = await fetch(url, {
        method: opt.method,
        headers,
        body: opt.body !== undefined ? JSON.stringify(opt.body) : undefined,
    });

    const expected = normalizeExpected(opt.expectedStatus);
    if (expected && !expected.includes(res.status)) {
        const msg = await readErrorMessage(res);
        throw new ApiError({ status: res.status, message: msg, url });
    }

    if (!res.ok) {
        const msg = await readErrorMessage(res);
        throw new ApiError({ status: res.status, message: msg, url });
    }
}

// ---- public APIs ----

export async function login(email: string, password: string): Promise<LoginResponse> {
    return requestJson<LoginResponse>({
        method: 'POST',
        path: '/api/voters/login',
        body: { email, password },
        expectedStatus: 200,
    });
}

export async function fetchMyElections(token: string): Promise<MyElection[]> {
    return requestJson<MyElection[]>({
        method: 'GET',
        path: '/api/voters/my-elections',
        token,
        expectedStatus: 200,
    });
}

export async function fetchElectionDetail(
    token: string,
    electionId: number,
): Promise<ElectionDetail> {
    return requestJson<ElectionDetail>({
        method: 'GET',
        path: `/api/elections/${electionId}`,
        token,
        expectedStatus: 200,
    });
}

export async function fetchCandidates(token: string, electionId: number): Promise<Candidate[]> {
    return requestJson<Candidate[]>({
        method: 'GET',
        path: `/api/elections/${electionId}/candidates`,
        token,
        expectedStatus: 200,
    });
}

export async function fetchMyVote(token: string, electionId: number): Promise<MyVote | null> {
    try {
        return await requestJson<MyVote>({
            method: 'GET',
            path: `/api/elections/${electionId}/votes/me`,
            token,
            expectedStatus: [200, 404],
        });
    } catch (e: unknown) {
        if (isApiError(e) && e.status === 404) return null;
        throw e;
    }
}

export async function castVote(
    token: string,
    electionId: number,
    candidateId: number,
): Promise<void> {
    await requestVoid({
        method: 'POST',
        path: `/api/elections/${electionId}/votes`,
        token,
        body: { candidateId },
        expectedStatus: [204, 200],
    });
}

export async function fetchElectionResult(
    token: string,
    electionId: number,
): Promise<ElectionResultItem[]> {
    return requestJson<ElectionResultItem[]>({
        method: 'GET',
        path: `/api/elections/${electionId}/results`,
        token,
        expectedStatus: 200,
    });
}

export async function fetchVoteHistory(token: string): Promise<VoteHistoryRow[]> {
    return requestJson<VoteHistoryRow[]>({
        method: 'GET',
        path: '/api/voters/my-votes',
        token,
        expectedStatus: 200,
    });
}

export async function fetchIdentityStatus(
    token: string,
    electionId: number,
): Promise<IdentityStatus> {
    return requestJson<IdentityStatus>({
        method: 'GET',
        path: `/api/voters/identity/status?electionId=${electionId}`,
        token,
        expectedStatus: 200,
    });
}

export async function verifyIdentity(
    token: string,
    electionId: number,
    req: VerifyIdentityRequest,
): Promise<void> {
    await requestVoid({
        method: 'POST',
        path: `/api/elections/${electionId}/verification`,
        token,
        body: req,
        expectedStatus: [204, 200],
    });
}

export async function fetchMyVerification(token: string, electionId: number): Promise<boolean> {
    return requestJson<boolean>({
        method: 'GET',
        path: `/api/elections/${electionId}/verification/me`,
        token,
        expectedStatus: 200,
    });
}
