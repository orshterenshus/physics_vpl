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
    }),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.response);
}

export async function evaluateStudentCode(
  problemDescription: string,
  teacherSolution: string,
  studentCode: string
): Promise<EvalResult> {
  const prompt = `You are an expert physics instructor and code reviewer. Evaluate the following student JavaScript submission for a physics problem.

PROBLEM DESCRIPTION:
${problemDescription}

TEACHER'S REFERENCE SOLUTION:
${teacherSolution}

STUDENT'S SUBMISSION (CODE & COMMENTS):
${studentCode}

EVALUATION INSTRUCTIONS:
1. Compare the student's solution against the teacher's reference solution and your own physical knowledge. Check for correct physics modeling and correct JavaScript numerical implementation.
2. Carefully read the student's inline comments. If there are NO comments explaining the thought process or physical reasoning, you MUST immediately deduct points from reasoningScore — a submission with no explanatory comments cannot score above 40 in reasoning.
3. If you deduct points in ANY category, you MUST explicitly state the reason why in the JSON response.

RETURN EXACTLY THIS JSON FORMAT (No markdown formatting, just raw JSON):
{
  "physicsScore": <number 0-100, 40% weight>,
  "codingScore": <number 0-100, 40% weight>,
  "reasoningScore": <number 0-100, 20% weight>,
  "grade": <overall score: physicsScore * 0.4 + codingScore * 0.4 + reasoningScore * 0.2>,
  "feedback": "<String: 2-3 sentences of overall feedback. If grade is below 70, also include concrete actionable steps the student should take to improve>",
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
      if (parsed.success) return parsed.data;
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
