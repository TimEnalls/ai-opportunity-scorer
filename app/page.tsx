"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RESULT_STORAGE_KEY } from "@/app/lib/score";

export default function Home() {
  const router = useRouter();
  const [skills, setSkills] = useState("");
  const [idea, setIdea] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills, idea }),
      });
      if (!response.ok) {
        throw new Error(`Scoring failed (${response.status})`);
      }
      const result = await response.json();
      sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
      router.push("/results");
    } catch {
      setError("Something went wrong while scoring. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-xl flex-col gap-7"
      >
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            AI Opportunity Scorer
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Describe your background and a business idea to score the
            opportunity.
          </p>
        </header>

        <div className="flex flex-col gap-2">
          <label htmlFor="skills" className="text-sm font-medium">
            Your skills and background
          </label>
          <textarea
            id="skills"
            name="skills"
            value={skills}
            onChange={(event) => setSkills(event.target.value)}
            rows={5}
            placeholder="e.g. 8 years in B2B SaaS sales, some Python, a network of small-business owners…"
            className="resize-y rounded-md border border-zinc-300 bg-transparent p-3 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 dark:border-zinc-700 dark:focus:border-zinc-400"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="idea" className="text-sm font-medium">
            The business idea
          </label>
          <textarea
            id="idea"
            name="idea"
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            rows={4}
            placeholder="Describe the candidate business idea in a few sentences…"
            className="resize-y rounded-md border border-zinc-300 bg-transparent p-3 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 dark:border-zinc-700 dark:focus:border-zinc-400"
          />
        </div>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Scoring…" : "Score this idea"}
        </button>
      </form>
    </main>
  );
}
