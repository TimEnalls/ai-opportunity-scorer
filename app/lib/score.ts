// Shared score types, imported by the /api/score route handler (server) and
// the /results page (client). Pure data only — no server-only APIs.

// Each axis is scored 0-100 where a HIGHER score is always better (including
// Time to Revenue, where a high score means a fast/short path to revenue).
// That uniform convention is what lets the page treat the lowest score as the
// weakest axis.
export type Axis = {
  label: string;
  score: number;
};

export type ScoreResult = {
  axes: Axis[];
  overall: string;
};

// Key used to hand the score result from the form to /results across navigation.
export const RESULT_STORAGE_KEY = "scoreResult";

// Hard-coded fake result. The input is intentionally ignored for now, and no
// model or external API is called. Note: the weakest axis is deliberately NOT
// included here — /results computes it from these four scores.
export function fakeScore(): ScoreResult {
  return {
    axes: [
      { label: "Unfair Advantage", score: 72 },
      { label: "Market Pull", score: 58 },
      { label: "Defensibility", score: 41 },
      { label: "Time to Revenue", score: 64 },
    ],
    overall:
      "This idea pairs a real personal edge with a workable path to revenue, but it is held back by how easily it could be copied once proven. The strongest play is to move fast on the advantages you already have while searching for a structural moat — distribution, data, or switching costs — that competitors cannot cheaply match. Treat these scores as a starting hypothesis, not a verdict.",
  };
}
