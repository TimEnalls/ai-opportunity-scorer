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
