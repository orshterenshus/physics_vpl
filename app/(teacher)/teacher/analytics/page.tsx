import { connectDB } from "@/lib/db";
import { Submission } from "@/models/Submission";
import { Problem } from "@/models/Problem";
import { computeProblemStats, computeMissingAspectCounts, SubmissionForAnalytics } from "@/lib/analytics";
import { AnalyticsChart } from "@/components/teacher/AnalyticsChart";

export default async function AnalyticsPage() {
  await connectDB();

  const submissions = await Submission.find(
    { grade: { $ne: null } },
    { problemId: 1, grade: 1, overrideGrade: 1, physicsScore: 1, codingScore: 1, reasoningScore: 1, deductionReasons: 1 }
  ).lean<SubmissionForAnalytics[]>();

  const problems = await Problem.find({}, { title: 1, chapter: 1, problemNumber: 1 }).sort({ chapter: 1, problemNumber: 1 }).lean();
  const problemMap = Object.fromEntries(problems.map((p) => [p._id.toString(), p]));

  const stats = computeProblemStats(submissions);
  const statsByProblemId = Object.fromEntries(stats.map((s) => [s.problemId, s]));
  const missingAspects = computeMissingAspectCounts(submissions);

  const gradedSubmissionsWithReasoningIssue = submissions.filter((s) => s.deductionReasons?.reasoning).length;

  const chartData = problems
    .filter((p) => statsByProblemId[p._id.toString()])
    .map((p) => ({
      title: `${p.problemNumber}. ${p.title}`,
      avgGrade: statsByProblemId[p._id.toString()].avgGrade,
    }));

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-1">Analytics</h1>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
        Based on {submissions.length} graded submission{submissions.length === 1 ? "" : "s"} across {problems.length} problem{problems.length === 1 ? "" : "s"}.
      </p>

      {chartData.length === 0 ? (
        <p className="text-gray-400">No graded submissions yet.</p>
      ) : (
        <>
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              Average grade by problem
            </h2>
            <AnalyticsChart data={chartData} />
          </div>

          <div className="mb-10 overflow-x-auto">
            <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              Per-problem breakdown
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 pr-4">Problem</th>
                  <th className="pb-3 pr-4">Submissions</th>
                  <th className="pb-3 pr-4">Avg Grade</th>
                  <th className="pb-3 pr-4">Avg Physics</th>
                  <th className="pb-3 pr-4">Avg Code</th>
                  <th className="pb-3 pr-4">Avg Reasoning</th>
                  <th className="pb-3">Below 70%</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((p) => {
                  const s = statsByProblemId[p._id.toString()];
                  if (!s) return null;
                  return (
                    <tr key={p._id.toString()} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{p.problemNumber}. {p.title}</td>
                      <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.submissionCount}</td>
                      <td className="py-3 pr-4 font-bold text-blue-600 dark:text-blue-400">{s.avgGrade}%</td>
                      <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.avgPhysics}</td>
                      <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.avgCoding}</td>
                      <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.avgReasoning}</td>
                      <td className="py-3 text-gray-500 dark:text-gray-400">{s.belowPassingCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              Most commonly missing reasoning aspects
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              Approximate — parsed from the LLM's free-text deduction reasons across all {gradedSubmissionsWithReasoningIssue} submissions with reasoning marked incomplete, not an exact structured count.
            </p>
            <div className="flex flex-col gap-2">
              {Object.entries(missingAspects)
                .sort((a, b) => b[1] - a[1])
                .map(([aspect, count]) => (
                  <div key={aspect} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2">
                    <span className="text-gray-700 dark:text-gray-300">{aspect}</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
