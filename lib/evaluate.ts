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

type CommentLevel = "none" | "blocks-only" | "inline";

function getCommentLevel(code: string): CommentLevel {
  const lines = code.split("\n");
  const hasInline = lines.some((line) => {
    const trimmed = line.trim();
    return trimmed.startsWith("#") && trimmed.length > 2;
  });
  if (hasInline) return "inline";
  const hasBlocks = code.includes("'''") || code.includes('"""');
  if (hasBlocks) return "blocks-only";
  return "none";
}

export async function evaluateStudentCode(
  problemDescription: string,
  teacherSolution: string,
  studentCode: string
): Promise<EvalResult> {
  const prompt = `You are an expert physics instructor evaluating a student's Python solution to a physics simulation problem.

PROBLEM DESCRIPTION:
${problemDescription}

TEACHER'S SOLUTION (reference — one valid approach, not the only correct answer):
${teacherSolution}

STUDENT'S SUBMISSION (CODE & COMMENTS):
${studentCode}

═══════════════════════════════════════════
EVALUATION PROCESS — follow these steps in order
═══════════════════════════════════════════

STEP 1 — PHYSICS SCORE: Evaluate the student's physics independently.
  Ask: "Does this code apply the correct physical laws, forces, and model for this problem?"
  If yes → physicsScore = 100. Use the teacher's solution only to identify which physics the problem requires.

  Deductions (use any integer in the given range):
  -30 to -40: completely wrong physical model or approach
  -20 to -30: key formula is incorrect
  -10 to -20: a required physical effect is missing
  -8  to -15: wrong physical constant value
  -5  to -12: unit handling error
  -2  to -8:  minor approximation that slightly affects the result
  NEVER deduct for: different but correct approach, variable naming, code style

STEP 2 — CODING SCORE: Evaluate the Python implementation independently.
  Ask: "Does this code produce correct results using a valid numerical method?"
  If yes → codingScore = 100 EXACTLY. Not 99, not 98 — 100.

  Only deduct for REAL implementation errors:
  -25 to -35: code produces numerically wrong results
  -15 to -25: wrong numerical method causing significant error
  -8  to -18: step size or loop bounds cause significant numerical error
  -5  to -12: off-by-one errors or incorrect loop ranges
  NEVER deduct for: different but valid implementation, style, variable naming, data structure choice, step size choice, memory usage, performance

STEP 3 — REASONING SCORE: Compare the student's comments to the teacher's solution comments.
  The teacher's comments are the reference for what a complete explanation looks like for this problem.
  Evaluate whether the student addresses the same physical concepts — exact wording does not matter.

  Comments include: # single-line, """docstrings""", '''block strings'''.

  For each of the 5 aspects below, mark COVERED if the student's comments address it in any form:
  1. Physical assumptions — mentions the model's assumptions (e.g. arbitrary constants, simplified model, unit mass)
  2. Forces and interactions — explains forces, acceleration, or Newton's law (e.g. F=ma, specific forces acting)
  3. Mathematical model — explains the equations or formulas being implemented
  4. Numerical method — names or explains the integration method (e.g. Forward Euler) or justifies the time step
  5. Stopping condition — explains when/why the simulation ends (e.g. sign change in vy, t_max reached, condition detected)

  Be INCLUSIVE: if the student mentions the concept even briefly, count it as covered. When in doubt, count it.

  EXACT SCORES — assign the score that matches the number of aspects covered. These are fixed values, not ranges:
  5 aspects covered → reasoningScore = 100
  4 aspects covered → reasoningScore = 80
  3 aspects covered → reasoningScore = 60
  2 aspects covered → reasoningScore = 40
  1 aspect  covered → reasoningScore = 20
  0 aspects covered → reasoningScore = 0

═══════════════════════════════════════════
RULES
═══════════════════════════════════════════
- A correct solution that differs from the teacher's still gets 100 for physics and coding.
- Every deduction must name the exact line item from Step 1 or Step 2. If you cannot name a specific line item, do not deduct.
- Set deductionReasons to null for any category that scores 100.
- If grade is below 70, the feedback must include concrete actionable steps to improve.

RETURN EXACTLY THIS JSON FORMAT (no markdown, no code blocks, raw JSON only):
{
  "physicsScore": <number 0-100>,
  "codingScore": <number 0-100>,
  "reasoningScore": <number 0-100>,
  "grade": <physicsScore * 0.4 + codingScore * 0.4 + reasoningScore * 0.2>,
  "feedback": "<2-3 sentences of overall feedback, including what to improve if grade < 70>",
  "deductionReasons": {
    "physics": "<specific deduction reason, or null if 100>",
    "coding": "<specific deduction reason, or null if 100>",
    "reasoning": "<which of the 5 aspects were missing, or null if 100>"
  }
}`;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const raw = await callOllama(prompt);
      const parsed = EvalSchema.safeParse(raw);
      if (parsed.success) {
        const result = parsed.data;
        // Enforce reasoning caps based on comment level
        const commentLevel = getCommentLevel(studentCode);
        if (commentLevel === "none") {
          result.reasoningScore = 0;
        } else if (commentLevel === "blocks-only") {
          result.reasoningScore = Math.min(result.reasoningScore, 25);
        }
        // "inline" → trust LLM's score
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
