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
  },
  { timestamps: true }
);

export const Submission =
  mongoose.models.Submission || mongoose.model<ISubmission>("Submission", SubmissionSchema);
