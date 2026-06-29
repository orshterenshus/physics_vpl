import mongoose, { Schema } from "mongoose";

export interface IDeductionReasons {
  physics: string | null;
  coding: string | null;
  reasoning: string | null;
}

export interface ISubmission {
  _id: string;
  studentId: string;
  problemId: string;
  sourceCode: string;
  executionOutput: string;
  grade: number | null;
  feedback: string;
  physicsScore: number | null;
  codingScore: number | null;
  reasoningScore: number | null;
  deductionReasons: IDeductionReasons | null;
  // A teacher's manual correction, layered on top of the LLM's grade/feedback.
  // The original grade/feedback above are never overwritten — these are only
  // used in addition, so the AI's original call is always still visible.
  overrideGrade: number | null;
  overrideFeedback: string | null;
  overriddenBy: string | null;
  overriddenAt: Date | null;
  createdAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    studentId: { type: String, required: true },
    problemId: { type: String, required: true },
    sourceCode: { type: String, required: true },
    executionOutput: { type: String, default: "" },
    grade: { type: Number, default: null },
    feedback: { type: String, default: "Evaluation pending" },
    physicsScore: { type: Number, default: null },
    codingScore: { type: Number, default: null },
    reasoningScore: { type: Number, default: null },
    deductionReasons: {
      type: {
        physics: { type: String, default: null },
        coding: { type: String, default: null },
        reasoning: { type: String, default: null },
      },
      default: null,
    },
    overrideGrade: { type: Number, default: null },
    overrideFeedback: { type: String, default: null },
    overriddenBy: { type: String, default: null },
    overriddenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Submission =
  mongoose.models.Submission || mongoose.model<ISubmission>("Submission", SubmissionSchema);
