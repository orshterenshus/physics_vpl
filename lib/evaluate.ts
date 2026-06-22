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

STEP 4 — DETAILED FEEDBACK: physicsScore, codingScore, and reasoningScore are now FINAL from Steps 1-3.
  Step 4 only explains those already-decided scores — it must never change them, and it must never imply a
  deduction or a missing aspect that Steps 1-3 did not already identify.
  Write feedback the student can act on, using only the scores and deductions already produced in Steps 1-3.
  The PROBLEM DESCRIPTION above may itself contain backslash LaTeX commands (e.g. \\omega, \\sin, \\hat{x}).
  Ignore that formatting style completely when writing this feedback — never copy it. The rules below for how to
  write math in the feedback (bold labels, plain-character formulas, literal Greek glyphs) apply regardless of how
  the problem description happens to be formatted.
  Structure it as 4 short parts, in this order, as ONE string. Each part starts with its bold-and-underlined label
  on its own line (**<u>Physics:</u>**, **<u>Coding:</u>**, **<u>Reasoning:</u>**, **<u>Priority:</u>**), and parts
  are separated by a blank line (use \n\n between parts, e.g.
  "**<u>Physics:</u>** ...text...\n\n**<u>Coding:</u>** ...text...").
  1. **<u>Physics:</u>** one sentence on what was correct. If physicsScore < 100, also state exactly what was wrong and the
     correct physical law/formula/effect to use instead (reference the specific deduction reason from Step 1).
     If physicsScore == 100, just confirm it was correct — do not search for issues.
  2. **<u>Coding:</u>** one sentence on what was correct. If codingScore < 100, also state exactly which part of the
     implementation produced wrong results or used an invalid method, and what change would fix it (reference
     the specific deduction reason from Step 2). If codingScore == 100, just confirm it was correct.
  3. **<u>Reasoning:</u>** if reasoningScore < 100, name only the aspect(s) from the 5-aspect list that Step 3 actually marked
     as not covered (not just "some are missing" — name them, e.g. "Numerical method" and "Stopping condition"),
     and give a one-line example of what a comment covering that aspect could say for this problem. If quoting that
     example, use single quotes (') around it, never double quotes (") — double quotes inside this JSON string
     must be escaped as \" and that is not reliable here, so avoid needing the escape entirely. If
     reasoningScore == 100, all 5 aspects were covered — say so, and do not name any aspect as missing.
  4. **<u>Priority:</u>** one sentence naming the single highest-impact thing to fix first to raise the grade the most. If all
     three scores are 100, say there is nothing left to fix. Omit this part entirely if all three scores are 100.
  If a category scored 100, say so briefly and move on — do not invent issues to fill space.
  Never use double quotes (") anywhere inside the feedback text itself (use single quotes ' instead) — this text
  is a JSON string value and an unescaped " inside it breaks the JSON.
  Be specific to THIS submission (cite variable/line behavior, not generic advice).
  Write any mathematical formula or equation using simple LaTeX, delimited with $...$ for inline math or $$...$$
  for a standalone equation on its own line. Plain variable names in prose (e.g. "vy" or "dt") don't need LaTeX —
  only actual formulas/equations do.
  Because the output is a JSON string, backslash LaTeX commands (\sin, \cos, \theta, \omega, \cdot, \Delta, \text,
  etc.) are FORBIDDEN — a backslash in a JSON string must be doubled or it corrupts the output, and that is not
  reliable here. Also never write the bare word "text" followed by braces (e.g. never write "text{omega}") — with
  no backslash that is not a command, it is just the literal letters t-e-x-t rendered as math variables next to
  whatever is in the braces, producing garbage like "extomega". Build formulas only from plain characters that
  need no backslash and no text{} wrapper: letters, digits, +, -, *, /, ^, _, (), and curly braces only for
  grouping an exponent or subscript. The feedback string must contain zero backslash characters.
  For omega, type the single character ω. For theta, type θ. For capital delta, type Δ.
  Example: "$a_y = 2*A*ω*cos(ωt) - ω^2*A*t*sin(ωt)$"

═══════════════════════════════════════════
RULES
═══════════════════════════════════════════
- A correct solution that differs from the teacher's still gets 100 for physics and coding.
- Every deduction must name the exact line item from Step 1 or Step 2. If you cannot name a specific line item, do not deduct.
- Set deductionReasons to null for any category that scores 100.
- The feedback must follow the STEP 4 structure regardless of the grade — detailed feedback is not just for grade < 70.
- Steps 1-3 produce the final scores. Step 4 is explanation only and must never alter physicsScore, codingScore, or reasoningScore.

RETURN EXACTLY THIS JSON FORMAT (no markdown, no code blocks, raw JSON only):
{
  "physicsScore": <number 0-100>,
  "codingScore": <number 0-100>,
  "reasoningScore": <number 0-100>,
  "grade": <physicsScore * 0.4 + codingScore * 0.4 + reasoningScore * 0.2>,
  "feedback": "<the STEP 4 structured feedback: Physics / Coding / Reasoning / Priority, separated by \\n\\n>",
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
