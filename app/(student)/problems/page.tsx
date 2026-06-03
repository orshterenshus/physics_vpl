import { connectDB } from "@/lib/db";
import { Problem } from "@/models/Problem";
import Link from "next/link";

interface ProblemDoc {
  _id: string;
  chapter: number;
  problemNumber: number;
  title: string;
}

export default async function ProblemsPage() {
  await connectDB();
  const problems = await Problem.find({}, { title: 1, chapter: 1, problemNumber: 1 }).sort({
    chapter: 1,
    problemNumber: 1,
  }).lean<ProblemDoc[]>();

  const byChapter = problems.reduce<Record<number, ProblemDoc[]>>((acc, p) => {
    if (!acc[p.chapter]) acc[p.chapter] = [];
    acc[p.chapter].push(p);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">Problems</h1>
      {Object.entries(byChapter).map(([chapter, probs]) => (
        <div key={chapter} className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            Chapter {chapter}
          </h2>
          <div className="flex flex-col gap-2">
            {probs.map((p) => (
              <Link
                key={p._id.toString()}
                href={`/problems/${p._id}`}
                className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-lg px-4 py-3 flex items-center justify-between transition-colors group"
              >
                <span className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {p.problemNumber}. {p.title}
                </span>
                <span className="text-gray-400 dark:text-gray-500 text-sm">Solve</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
      {problems.length === 0 && (
        <p className="text-gray-400">No problems yet. Check back later.</p>
      )}
    </div>
  );
}
