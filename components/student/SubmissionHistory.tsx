"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";

export interface HistoryRow {
  id: string;
  grade: number | null;
  overrideGrade: number | null;
  feedback: string;
  overrideFeedback: string | null;
  physicsScore: number | null;
  codingScore: number | null;
  reasoningScore: number | null;
  createdAt: string;
}

export function SubmissionHistory({ rows }: { rows: HistoryRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {rows.map((s) => {
        const grade = s.overrideGrade ?? s.grade;
        const feedback = s.overrideFeedback ?? s.feedback;
        const isExpanded = expandedId === s.id;
        return (
          <div key={s.id} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : s.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(s.createdAt).toLocaleString("en-US", { timeZone: "UTC" })}
              </span>
              <div className="flex items-center gap-3">
                {s.overrideGrade !== null && (
                  <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 px-2 py-0.5 rounded font-medium">
                    Adjusted by teacher
                  </span>
                )}
                <span className={`font-bold ${grade !== null && grade >= 70 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {grade !== null ? `${grade}%` : "Pending..."}
                </span>
                <span className="text-gray-400 dark:text-gray-600 text-xs">{isExpanded ? "−" : "+"}</span>
              </div>
            </button>
            {isExpanded && (
              <div className="px-4 pb-4 flex flex-col gap-3 border-t border-gray-200 dark:border-gray-800 pt-3">
                {grade !== null && (
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {([["Physics", s.physicsScore], ["Code", s.codingScore], ["Reasoning", s.reasoningScore]] as [string, number | null][]).map(([label, score]) => (
                      <div key={label} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                        <div className="text-blue-600 dark:text-blue-400 font-bold">{score}</div>
                        <div className="text-gray-500">{label}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="prose prose-gray dark:prose-invert prose-sm max-w-none [&_p]:leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>
                    {feedback}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {rows.length === 0 && <p className="text-gray-400">No submissions yet for this problem.</p>}
    </div>
  );
}
