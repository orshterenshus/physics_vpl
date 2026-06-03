import mongoose, { Schema } from "mongoose";

export interface IParameter {
  name: string;
  symbol: string;
  value: number;
  unit: string;
}

export interface IProblem {
  _id: string;
  chapter: number;
  problemNumber: number;
  title: string;
  description: string;
  imageUrl?: string;
  parameters: IParameter[];
  starterCode: string;
  teacherSolution: string;
  evaluationHints: string;
  createdAt: Date;
  updatedAt: Date;
}

const ParameterSchema = new Schema<IParameter>({
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  value: { type: Number, required: true },
  unit: { type: String, required: true },
});

const ProblemSchema = new Schema<IProblem>(
  {
    chapter: { type: Number, required: true },
    problemNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String },
    parameters: [ParameterSchema],
    starterCode: { type: String, default: "const g = 9.8;\n\nfunction solve() {\n\n}\n\nsolve();\n" },
    teacherSolution: { type: String, default: "" },
    evaluationHints: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Problem = mongoose.models.Problem || mongoose.model<IProblem>("Problem", ProblemSchema);
