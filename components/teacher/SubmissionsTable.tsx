"use client";

import { Fragment, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";

export interface SubmissionRow {
  id: string;
  studentLabel: string;
  problemTitle: string;
  grade: number | null;
  physicsScore: number | null;
  codingScore: number | null;
  reasoningScore: number | null;
  feedback: string;
  createdAt: string;
}

export function SubmissionsTable({ rows }: { rows: SubmissionRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
          <th className="pb-3 pr-4">Student</th>
          <th className="pb-3 pr-4">Problem</th>
          <th className="pb-3 pr-4">Grade</th>
          <th className="pb-3 pr-4">Physics</th>
          <th className="pb-3 pr-4">Code</th>
          <th className="pb-3 pr-4">Reasoning</th>
          <th className="pb-3 pr-4">Submitted</th>
          <th className="pb-3"></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s) => {
          const isExpanded = expandedId === s.id;
          return (
            <Fragment key={s.id}>
              <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{s.studentLabel}</td>
                <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{s.problemTitle}</td>
                <td className="py-3 pr-4">
                  {s.grade !== null ? (
                    <span className={`font-bold ${s.grade >= 70 ? "text-green-400" : "text-red-400"}`}>
                      {s.grade}%
                    </span>
                  ) : (
                    <span className="text-gray-500">Pending</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.physicsScore ?? "—"}</td>
                <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.codingScore ?? "—"}</td>
                <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.reasoningScore ?? "—"}</td>
                <td className="py-3 pr-4 text-gray-400 dark:text-gray-500 text-xs">
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 text-right">
                  {s.feedback && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                      aria-label={isExpanded ? "Collapse feedback" : "Expand feedback"}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold transition-colors"
                    >
                      {isExpanded ? "−" : "+"}
                    </button>
                  )}
                </td>
              </tr>
              {isExpanded && (
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td colSpan={8} className="bg-gray-50 dark:bg-gray-900 px-4 py-4">
                    <div className="prose prose-gray dark:prose-invert prose-sm max-w-none [&_p]:leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>
                        {s.feedback}
                      </ReactMarkdown>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
