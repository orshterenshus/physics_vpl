import { connectDB } from "@/lib/db";
import { Problem } from "@/models/Problem";
import { Submission } from "@/models/Submission";
import { auth } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SubmissionHistory, HistoryRow } from "@/components/student/SubmissionHistory";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SubmissionHistoryPage({ params }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  await connectDB();

  const problem = await Problem.findById(id, { title: 1, chapter: 1, problemNumber: 1 }).lean<{
    title: string;
    chapter: number;
    problemNumber: number;
  } | null>();
  if (!problem) redirect("/problems");

  const submissions = await Submission.find(
    { studentId: session.user.id, problemId: id },
    {
      grade: 1, overrideGrade: 1, feedback: 1, overrideFeedback: 1,
      physicsScore: 1, codingScore: 1, reasoningScore: 1, createdAt: 1,
    }
  ).sort({ createdAt: -1 }).lean();

  const rows: HistoryRow[] = submissions.map((s) => ({
    id: s._id.toString(),
    grade: s.grade,
    overrideGrade: s.overrideGrade,
    feedback: s.feedback,
    overrideFeedback: s.overrideFeedback,
    physicsScore: s.physicsScore,
    codingScore: s.codingScore,
    reasoningScore: s.reasoningScore,
    createdAt: new Date(s.createdAt).toISOString(),
  }));

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link href={`/problems/${id}`} className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
        ← Back to problem
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">{problem.title}</h1>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
        Chapter {problem.chapter} · #{problem.problemNumber} — submission history
      </p>
      <SubmissionHistory rows={rows} />
    </div>
  );
}
