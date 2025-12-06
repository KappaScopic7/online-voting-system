// frontend/src/api/authClient.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
};

export type MyElection = {
  electionId: number;
  code: string;
  name: string;
  districtName: string;
  status: "DRAFT" | "PUBLISHED" | "OPEN" | "CLOSED";
  startsAt: string;
  endsAt: string;
};

export type ElectionDetail = {
  id: number;
  code: string;
  name: string;
  description: string;
  districtName: string;
  status: "DRAFT" | "PUBLISHED" | "OPEN" | "CLOSED";
  startsAt: string;
  endsAt: string;
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/voters/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "ログインに失敗しました");
  }

  return res.json();
}

export async function fetchMyElections(token: string): Promise<MyElection[]> {
  const res = await fetch(`${API_BASE}/api/voters/my-elections`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error("unauthorized");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "My選挙一覧の取得に失敗しました");
  }

  return res.json();
}

export async function fetchElectionDetail(
  token: string,
  electionId: number
): Promise<ElectionDetail> {
  const res = await fetch(`${API_BASE}/api/elections/${electionId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error("unauthorized");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "選挙詳細の取得に失敗しました");
  }

  return res.json();
}
// すでにある export type, login, fetchMyElections, fetchElectionDetail の下あたりに追記

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

export async function fetchCandidates(
  token: string,
  electionId: number
): Promise<Candidate[]> {
  const res = await fetch(`${API_BASE}/api/elections/${electionId}/candidates`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error("unauthorized");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "候補者一覧の取得に失敗しました");
  }

  return res.json();
}

export async function fetchMyVote(
  token: string,
  electionId: number
): Promise<MyVote | null> {
  const res = await fetch(`${API_BASE}/api/elections/${electionId}/votes/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 404) {
    return null; // まだ投票していない
  }

  if (res.status === 401) {
    throw new Error("unauthorized"); // ← 本当の認証エラー
  }

  if (res.status === 403) {
    const text = await res.text();
    throw new Error(text || "この選挙では投票できません。"); // ← 業務エラー
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "投票状況の取得に失敗しました");
  }

  return res.json();
}

export async function castVote(
  token: string,
  electionId: number,
  candidateId: number
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/elections/${electionId}/votes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ candidateId }),
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error("unauthorized");
  }

  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(text || "投票に失敗しました");
  }
}

export type ElectionResultItem = {
  candidateId: number;
  candidateName: string;
  partyName: string | null;
  voteCount: number;
};

export async function fetchElectionResult(
  token: string,
  electionId: number
): Promise<ElectionResultItem[]> {
  const res = await fetch(`${API_BASE}/api/elections/${electionId}/results`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    throw new Error("unauthorized");
  }

  if (res.status === 403) {
    const text = await res.text();
    throw new Error(
      text || "この選挙の結果はまだ閲覧できません。"
    );
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "選挙結果の取得に失敗しました");
  }

  return res.json();
}
