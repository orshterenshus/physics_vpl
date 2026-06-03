import { connectDB } from "@/lib/db";
import { Problem } from "@/models/Problem";
import { notFound } from "next/navigation";
import { ProblemEditor } from "@/components/editor/ProblemEditor";

export default async function EditProblemPage({ params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const problem = await Problem.findById(id).lean();
  if (!problem) notFound();

  return <ProblemEditor problem={JSON.parse(JSON.stringify(problem))} />;
}
