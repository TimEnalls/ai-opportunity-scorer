import Anthropic from "@anthropic-ai/sdk";
import type { ScoreResult } from "@/app/lib/score";

// POST /api/score
// Accepts JSON { skills, idea }, asks Claude to score the opportunity on four
// axes, and returns a ScoreResult in the exact shape /results expects. The
// weakest axis is intentionally NOT returned — /results computes it from the
// four scores.

const SYSTEM_PROMPT = `You are an honest evaluator of business and product ideas. Your job is to give the person a clear, accurate read on an idea's real prospects, not to encourage them. You respect them by telling the truth.

You will receive two things:
1. The person's skills and background.
2. A candidate idea, in a few sentences.

Score the idea on four axes, each 0–100:

- UNFAIR ADVANTAGE: Does THIS person have an edge most others attempting this idea would not? Score against their stated background, not against an idealized founder. Generic ambition is not an advantage. Specific, rare, and relevant experience is.

- MARKET DEMAND: Is there evidence people actively want this and would pay, or is the demand assumed? Reward signals of real pull. Penalize "people will obviously want this."

- HARD TO COPY: Once this is proven to work, how easily can a fast follower copy it? Distribution, proprietary data, switching costs, and network effects raise this. A clever idea with no moat scores low here, and that is common and correct.

- TIME TO REVENUE: How quickly can this realistically reach a first paying customer? Reward short, concrete paths. Penalize anything that needs scale, a platform, or a long build before the first dollar.

SCORING DISCIPLINE — read this twice:
- Score honestly and use the full range. A genuinely strong idea from a well-matched founder should score in the 80s. A weak idea should score in the 20s and 30s. Do not cluster everything in the 50s and 60s. A tool that scores everything the same is worthless.
- The score reflects reality. The advice is where you are helpful. NEVER raise a score to make your advice feel more achievable. An honest 38 with a clear next move is the product. A flattering 68 is failure.
- It is correct and expected for most early ideas to be weak on at least one axis, usually hard to copy or market demand. Say so plainly.
- If the idea is genuinely strong, say that plainly too. Do not hedge a good idea into mediocrity out of caution.

OUTPUT:
Return ONLY valid JSON, no preamble, in exactly this shape:
{
  "unfair_advantage": <integer 0-100>,
  "market_demand": <integer 0-100>,
  "hard_to_copy": <integer 0-100>,
  "time_to_revenue": <integer 0-100>,
  "overall_read": "<2-4 sentences: the honest headline, then the single most important move this person should make next. Plain, declarative sentences. No em dashes. No hedging language like 'it could be argued' or 'you might consider.' State it.>"
}

Do not return the weakest axis. The app computes that itself.`;

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

// Shape the model returns (see SYSTEM_PROMPT): flat, snake_cased scores + read.
type ModelScore = {
  unfair_advantage: number;
  market_demand: number;
  hard_to_copy: number;
  time_to_revenue: number;
  overall_read: string;
};

// Map each model key to the axis label /results renders. These labels MUST
// match the WEAK_NOTES keys on the results page exactly. Order is the order the
// axes appear on the page.
const AXES = [
  { key: "unfair_advantage", label: "Unfair Advantage" },
  { key: "market_demand", label: "Market Demand" },
  { key: "hard_to_copy", label: "Hard to Copy" },
  { key: "time_to_revenue", label: "Time to Revenue" },
] as const;

// Round to an integer and keep it within the 0-100 range the progress bars expect.
function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Strip an optional ```json ... ``` fence so a fenced reply still parses.
function unfence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1].trim() : trimmed;
}

// Validate the model's JSON before we trust it. A well-formed-but-wrong-shape
// reply is treated as an error so /results can't crash on missing scores.
function isModelScore(value: unknown): value is ModelScore {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.overall_read !== "string") return false;
  return AXES.every(({ key }) => typeof obj[key] === "number");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const skills = typeof body?.skills === "string" ? body.skills : "";
  const idea = typeof body?.idea === "string" ? body.idea : "";

  if (!skills.trim() || !idea.trim()) {
    return Response.json(
      { error: "Both skills and an idea are required." },
      { status: 400 },
    );
  }

  const userMessage = `Skills and background:\n${skills}\n\nIdea:\n${idea}`;

  let rawText: string;
  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8192,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    rawText = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();
  } catch (error) {
    console.error("[/api/score] Anthropic request failed:", error);
    return Response.json(
      { error: "The scoring service is unavailable. Please try again." },
      { status: 502 },
    );
  }

  // Parse the model's JSON. If it's malformed (or the wrong shape), log the raw
  // text and return a clean error so the page shows a message instead of crashing.
  let parsed: unknown;
  try {
    parsed = JSON.parse(unfence(rawText));
  } catch (error) {
    console.error("[/api/score] Model returned malformed JSON:", error, "\nRaw:", rawText);
    return Response.json(
      { error: "Could not read the scoring result. Please try again." },
      { status: 502 },
    );
  }

  if (!isModelScore(parsed)) {
    console.error("[/api/score] Model JSON did not match the expected shape:\nRaw:", rawText);
    return Response.json(
      { error: "Could not read the scoring result. Please try again." },
      { status: 502 },
    );
  }

  // Reshape the flat model output into the ScoreResult /results consumes.
  const result: ScoreResult = {
    axes: AXES.map(({ key, label }) => ({ label, score: clamp(parsed[key]) })),
    overall: parsed.overall_read,
  };

  return Response.json(result);
}
