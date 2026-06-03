import { connectDB } from "@/lib/db";
import { Problem } from "@/models/Problem";
import { notFound } from "next/navigation";
import { ProblemSolver } from "@/components/editor/ProblemSolver";

export default async function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const problem = await Problem.findById(id, { teacherSolution: 0, evaluationHints: 0 }).lean();
  if (!problem) notFound();

  return <ProblemSolver problem={JSON.parse(JSON.stringify(problem))} />;
}
