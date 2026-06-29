const REASONING_ASPECTS = [
  "Physical assumptions",
  "Forces and interactions",
  "Mathematical model",
  "Numerical method",
  "Stopping condition",
] as const;

export interface SubmissionForAnalytics {
  problemId: string;
  grade: number | null;
  overrideGrade: number | null;
  physicsScore: number | null;
  codingScore: number | null;
  reasoningScore: number | null;
  deductionReasons: { reasoning: string | null } | null;
}

export interface ProblemStats {
  problemId: string;
  submissionCount: number;
  avgGrade: number;
  avgPhysics: number;
  avgCoding: number;
  avgReasoning: number;
  belowPassingCount: number;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

// Per-problem aggregate stats, using each submission's effective grade
// (a teacher's override if set, otherwise the LLM's original grade).
export function computeProblemStats(submissions: SubmissionForAnalytics[]): ProblemStats[] {
  const byProblem = new Map<string, SubmissionForAnalytics[]>();
  for (const s of submissions) {
    const list = byProblem.get(s.problemId) ?? [];
    list.push(s);
    byProblem.set(s.problemId, list);
  }

  const stats: ProblemStats[] = [];
  for (const [problemId, subs] of byProblem) {
    const grades = subs.map((s) => s.overrideGrade ?? s.grade).filter((g): g is number => g !== null);
    stats.push({
      problemId,
      submissionCount: subs.length,
      avgGrade: avg(grades),
      avgPhysics: avg(subs.map((s) => s.physicsScore).filter((g): g is number => g !== null)),
      avgCoding: avg(subs.map((s) => s.codingScore).filter((g): g is number => g !== null)),
      avgReasoning: avg(subs.map((s) => s.reasoningScore).filter((g): g is number => g !== null)),
      belowPassingCount: grades.filter((g) => g < 70).length,
    });
  }
  return stats;
}

// Best-effort count of how often each of the 5 reasoning aspects was marked
// missing, parsed from the free-text deductionReasons.reasoning field the LLM
// writes (e.g. "Numerical method, Stopping condition"). Not perfectly precise
// since it's substring matching over natural-language text, not a structured
// field — intended as a rough signal for "what do students miss most," not an
// exact count.
export function computeMissingAspectCounts(submissions: SubmissionForAnalytics[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const aspect of REASONING_ASPECTS) counts[aspect] = 0;

  for (const s of submissions) {
    const text = s.deductionReasons?.reasoning;
    if (!text) continue;
    for (const aspect of REASONING_ASPECTS) {
      if (text.toLowerCase().includes(aspect.toLowerCase())) {
        counts[aspect]++;
      }
    }
  }
  return counts;
}
