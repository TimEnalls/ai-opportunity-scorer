"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  RESULT_STORAGE_KEY,
  type Axis,
  type ScoreResult,
} from "@/app/lib/score";

// One-sentence explanation per axis, shown only when that axis is the weakest.
// These live on the page (not in the API result) and are keyed by axis label.
const WEAK_NOTES: Record<string, string> = {
  "Unfair Advantage":
    "Little here is uniquely yours, so competitors with similar resources could replicate your edge quickly.",
  "Market Pull":
    "Demand signals are soft, so you may have to push the product onto customers rather than being pulled by them.",
  Defensibility:
    "There is little stopping a fast follower from copying this once it works, so early traction may not become a durable moat.",
  "Time to Revenue":
    "The path to the first paying customer looks long, which raises the capital and conviction needed to reach it.",
};

// Real logic: the weakest axis is the lowest score of the four. Ties resolve to
// the first such axis in order. Computed on the page from the returned numbers.
function weakestAxis(axes: Axis[]): Axis {
  return axes.reduce((min, axis) => (axis.score < min.score ? axis : min));
}

export default function ResultsPage() {
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(RESULT_STORAGE_KEY);
    if (raw) {
      try {
        setResult(JSON.parse(raw) as ScoreResult);
      } catch {
        setResult(null);
      }
    }
    setReady(true);
  }, []);

  // Avoid a flash of the empty state before sessionStorage is read.
  if (!ready) return null;

  if (!result) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="flex w-full max-w-xl flex-col gap-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">No result yet</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Score an idea first to see results here.
          </p>
          <Link
            href="/"
            className="self-center text-sm text-zinc-600 underline underline-offset-4 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Go to the form
          </Link>
        </div>
      </main>
    );
  }

  const weakest = weakestAxis(result.axes);
  const weakestNote =
    WEAK_NOTES[weakest.label] ?? "This is the lowest-scoring axis.";

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-xl flex-col gap-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Opportunity Score
        </h1>

        <section className="flex flex-col gap-5">
          {result.axes.map((axis) => (
            <div key={axis.label} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">{axis.label}</span>
                <span className="text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                  {axis.score}
                  <span className="text-zinc-400 dark:text-zinc-600">/100</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-foreground"
                  style={{ width: `${axis.score}%` }}
                />
              </div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Overall read
          </h2>
          <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            {result.overall}
          </p>
        </section>

        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Weakest axis: {weakest.label} ({weakest.score}/100)
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-800 dark:text-amber-300/90">
            {weakestNote}
          </p>
        </div>

        <Link
          href="/"
          className="self-start text-sm text-zinc-600 underline underline-offset-4 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Score another idea
        </Link>
      </div>
    </main>
  );
}
