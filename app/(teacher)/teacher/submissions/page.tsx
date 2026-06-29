import { connectDB } from "@/lib/db";
import { Submission } from "@/models/Submission";
import { Problem } from "@/models/Problem";
import { User } from "@/models/User";
import Link from "next/link";
import { SubmissionsTable } from "@/components/teacher/SubmissionsTable";
import { buildCreatedAtFilter } from "@/lib/dateRangeQuery";

interface PageProps {
  searchParams: Promise<{ problemId?: string; from?: string; to?: string }>;
}

export default async function SubmissionsPage({ searchParams }: PageProps) {
  const { problemId, from, to } = await searchParams;
  await connectDB();

  const query: Record<string, unknown> = { grade: { $ne: null } };
  if (problemId) query.problemId = problemId;
  const createdAt = buildCreatedAtFilter(from, to);
  if (createdAt) query.createdAt = createdAt;
  const submissions = await Submission.find(query).sort({ createdAt: -1 }).lean();

  const studentIds = [...new Set(submissions.map((s) => s.studentId.toString()))];

  const [allProblems, students] = await Promise.all([
    Problem.find({}, { title: 1, chapter: 1, problemNumber: 1 }).sort({ chapter: 1, problemNumber: 1 }).lean(),
    User.find({ _id: { $in: studentIds } }, { name: 1, email: 1 }).lean(),
  ]);

  const problemMap = Object.fromEntries(allProblems.map((p) => [p._id.toString(), p]));
  const studentMap = Object.fromEntries(students.map((s) => [s._id.toString(), s]));

  const rows = submissions.map((s) => {
    const student = studentMap[s.studentId.toString()];
    const problem = problemMap[s.problemId.toString()];
    return {
      id: s._id.toString(),
      studentLabel: student?.name ?? student?.email ?? "Unknown",
      problemTitle: problem?.title ?? "Unknown",
      grade: s.grade ?? null,
      physicsScore: s.physicsScore ?? null,
      codingScore: s.codingScore ?? null,
      reasoningScore: s.reasoningScore ?? null,
      feedback: s.feedback ?? "",
      overrideGrade: s.overrideGrade ?? null,
      overrideFeedback: s.overrideFeedback ?? null,
      createdAt: new Date(s.createdAt).toISOString(),
    };
  });

  const exportParams = new URLSearchParams();
  if (problemId) exportParams.set("problemId", problemId);
  if (from) exportParams.set("from", from);
  if (to) exportParams.set("to", to);
  const exportQuery = exportParams.toString();
  const hasFilters = Boolean(problemId || from || to);

  const inputCls = "bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500";

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Submissions</h1>
        <a
          href={`/api/teacher/submissions/export${exportQuery ? `?${exportQuery}` : ""}`}
          className="text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1.5 transition-colors"
        >
          Export CSV
        </a>
      </div>

      <form action="/teacher/submissions" method="GET" className="flex items-end gap-3 flex-wrap mb-8">
        <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          Problem
          <select name="problemId" defaultValue={problemId ?? ""} className={inputCls}>
            <option value="">All problems</option>
            {allProblems.map((p) => (
              <option key={p._id.toString()} value={p._id.toString()}>
                {p.problemNumber}. {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          From
          <input type="date" name="from" defaultValue={from ?? ""} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          To
          <input type="date" name="to" defaultValue={to ?? ""} className={inputCls} />
        </label>
        <button type="submit" className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
          Apply filters
        </button>
        {hasFilters && (
          <Link href="/teacher/submissions" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white pb-2">
            Clear filters
          </Link>
        )}
      </form>

      <div className="overflow-x-auto">
        <SubmissionsTable rows={rows} />
        {submissions.length === 0 && (
          <p className="text-gray-400 mt-4">No submissions match these filters.</p>
        )}
      </div>
    </div>
  );
}
