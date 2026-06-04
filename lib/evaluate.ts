import { z } from "zod";
import { connectDB } from "./db";
import { Submission } from "@/models/Submission";
import { IProblem } from "@/models/Problem";

const DeductionReasonsSchema = z.object({
  physics: z.string().nullable(),
  coding: z.string().nullable(),
  reasoning: z.string().nullable(),
});

const EvalSchema = z.object({
  physicsScore: z.number().min(0).max(100),
  codingScore: z.number().min(0).max(100),
  reasoningScore: z.number().min(0).max(100),
  grade: z.number().min(0).max(100),
  feedback: z.string(),
  deductionReasons: DeductionReasonsSchema,
});

export type EvalResult = z.infer<typeof EvalSchema>;

async function callOllama(prompt: string): Promise<unknown> {
  const res = await fetch(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL,
      prompt,
      format: "json",
      stream: false,
      options: { num_predict: 2048, temperature: 0, seed: 42 },
    }),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  // Strip <think>...</think> blocks that Qwen3 emits before the JSON
  const raw = data.response.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  return JSON.parse(raw);
}

function hasExplanatoryComments(code: string): boolean {
  return code.split("\n").some((line) => {
    const trimmed = line.trim();
    return trimmed.startsWith("#") && trimmed.length > 1;
  });
}

export async function evaluateStudentCode(
  problemDescription: string,
  teacherSolution: string,
  studentCode: string
): Promise<EvalResult> {
  const prompt = `You are an expert physics instructor and code reviewer. Evaluate the following student JavaScript submission for a physics problem.

PROBLEM DESCRIPTION:
${problemDescription}

EXAMPLE SOLUTION (one valid approach — not the only correct answer):
${teacherSolution}

STUDENT'S SUBMISSION (CODE & COMMENTS):
${studentCode}

GRADING PROCESS — follow these steps in order:

STEP 1: Evaluate the student's code on its own merits, ignoring the example solution entirely.
  Ask yourself: "Is this code physically correct? Does it correctly solve the problem as described?"
  If yes → physicsScore = 100, codingScore = 100. Stop here for these two categories.
  Only proceed to Step 2 if you found a concrete error in Step 1.

STEP 2: Use the example solution only to check if the student missed a required physical effect.
  The example solution is ONE valid approach, not the only valid approach.
  Do NOT deduct because the student used a different method, different variable names, or different code structure.
  Only deduct if the student is missing physics that the problem explicitly requires.

PHYSICS SCORE — deduct only for these specific errors (use any integer in the range):
  -30 to -40: completely wrong physical model
  -20 to -30: key formula is wrong
  -10 to -20: required physical effect is missing
  -8  to -15: wrong physical constant
  -5  to -12: unit error
  -2  to -8:  minor approximation that slightly affects result
  NEVER deduct for: different but correct approach, variable names, code style

CODING SCORE — deduct only for these specific errors (use any integer in the range):
  -25 to -35: code produces numerically wrong results
  -15 to -25: wrong numerical method that causes significant error
  -8  to -18: step size or loop bounds cause significant numerical error
  -5  to -12: off-by-one or incorrect loop ranges
  -2  to -8:  unnecessary complexity with no effect on correctness
  NEVER deduct for: different but valid implementation, style, structure

REASONING SCORE — deduct only for these:
  -30 to -40: zero comments in the submission
  -15 to -30: comments only describe what the code does, not why
  -5  to -15: comments explain some reasoning but miss key physical assumptions
  0 deductions: comments clearly explain physical reasoning and assumptions

RULE: Every deduction MUST name the exact line item from above. If you cannot name one, do not deduct. Set deductionReasons to null for any category that scores 100.

RETURN EXACTLY THIS JSON FORMAT (No markdown formatting, just raw JSON):
{
  "physicsScore": <number 0-100, 40% weight>,
  "codingScore": <number 0-100, 40% weight>,
  "reasoningScore": <number 0-100, 20% weight>,
  "grade": <overall score: physicsScore * 0.4 + codingScore * 0.4 + reasoningScore * 0.2>,
  "feedback": "<String: 2-3 sentences of overall feedback. If grade is below 70, include concrete actionable steps to improve>",
  "deductionReasons": {
    "physics": "<String explaining physics deductions, or null if 100>",
    "coding": "<String explaining JS/numerical deductions, or null if 100>",
    "reasoning": "<String explaining missing reasoning in comments, or null if 100>"
  }
}`;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const raw = await callOllama(prompt);
      const parsed = EvalSchema.safeParse(raw);
      if (parsed.success) {
        const result = parsed.data;
        // Only override reasoning when there are zero comments — otherwise use LLM's score
        if (!hasExplanatoryComments(studentCode)) {
          result.reasoningScore = 50;
        }
        // Always recalculate grade from components so the LLM can't fudge it
        result.grade = Math.round(
          result.physicsScore * 0.4 +
          result.codingScore * 0.4 +
          result.reasoningScore * 0.2
        );
        return result;
      }
      lastError = new Error(`Zod validation failed: ${parsed.error.message}`);
    } catch (err) {
      lastError = err as Error;
    }
  }

  throw new Error(`LLM evaluation failed after 3 attempts: ${lastError?.message}`);
}

export async function evaluateSubmission(
  submissionId: string,
  problem: IProblem,
  studentCode: string
): Promise<void> {
  let result: EvalResult;
  try {
    result = await evaluateStudentCode(
      `${problem.title}\n\n${problem.description}\n\nEvaluation Hints: ${problem.evaluationHints}`,
      problem.teacherSolution,
      studentCode
    );
  } catch (err) {
    console.error(`Evaluation failed for submission ${submissionId}:`, err);
    return;
  }

  await connectDB();
  await Submission.findByIdAndUpdate(submissionId, {
    grade: result.grade,
    feedback: result.feedback,
    physicsScore: result.physicsScore,
    codingScore: result.codingScore,
    reasoningScore: result.reasoningScore,
    deductionReasons: result.deductionReasons,
  });
}
