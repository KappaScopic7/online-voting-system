// api/votes.ts
import { http } from "../../shared/http";

/* ===== types ===== */
export type VoteHistoryItem = {
  voteId: string;
  electionId: string;
  electionTitle: string;
  candidateId: string;
  candidateName: string;
  castedAt: string;
};

export type VoteStartResponse = {
  electionId: string;
  title: string;
  candidates: {
    candidateId: string;
    name: string;
  }[];
};

/* ===== api ===== */
export async function startVoting(
  electionId: string,
): Promise<VoteStartResponse> {
  const res = await http.get<VoteStartResponse>("/api/voting/start", {
    params: { electionId },
  });
  return res.data;
}

export async function confirmVote(
  electionId: string,
  candidateId: string,
): Promise<VoteHistoryItem> {
  const res = await http.post<VoteHistoryItem>("/api/voting/confirm", {
    electionId,
    candidateId,
  });
  return res.data;
}

export async function fetchVoteHistory(): Promise<VoteHistoryItem[]> {
  const res = await http.get<VoteHistoryItem[]>("/api/votes");
  return res.data;
}
