import { fakeScore } from "@/app/lib/score";

// POST /api/score
// Accepts JSON { skills, idea } in the body. For now the input is read but
// ignored, and a hard-coded fake ScoreResult is returned. No model or external
// API is called. The weakest axis is intentionally not returned — /results
// computes it from the four scores.
export async function POST(request: Request) {
  await request.json().catch(() => ({}));
  return Response.json(fakeScore());
}
