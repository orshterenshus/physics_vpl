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
  overrideGrade: number | null;
  overrideFeedback: string | null;
  createdAt: string;
}

export function SubmissionsTable({ rows: initialRows }: { rows: SubmissionRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [overrideForm, setOverrideForm] = useState<{ grade: string; feedback: string } | null>(null);
  const [saving, setSaving] = useState(false);

  function startEditing(s: SubmissionRow) {
    setOverrideForm({
      grade: String(s.overrideGrade ?? s.grade ?? ""),
      feedback: s.overrideFeedback ?? "",
    });
  }

  async function saveOverride(id: string) {
    if (!overrideForm) return;
    const grade = Number(overrideForm.grade);
    if (Number.isNaN(grade) || grade < 0 || grade > 100) {
      alert("Grade must be a number between 0 and 100");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/teacher/submissions/${id}/override`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade, feedback: overrideForm.feedback }),
    });
    setSaving(false);
    if (res.ok) {
      const updated = await res.json();
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, overrideGrade: updated.overrideGrade, overrideFeedback: updated.overrideFeedback } : r)));
      setOverrideForm(null);
    } else {
      alert("Failed to save override");
    }
  }

  async function clearOverride(id: string) {
    if (!confirm("Revert to the AI's original grade for this submission?")) return;
    setSaving(true);
    const res = await fetch(`/api/teacher/submissions/${id}/override`, { method: "DELETE" });
    setSaving(false);
    if (res.ok) {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, overrideGrade: null, overrideFeedback: null } : r)));
      setOverrideForm(null);
    } else {
      alert("Failed to clear override");
    }
  }

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
          const grade = s.overrideGrade ?? s.grade;
          const feedback = s.overrideFeedback ?? s.feedback;
          return (
            <Fragment key={s.id}>
              <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{s.studentLabel}</td>
                <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{s.problemTitle}</td>
                <td className="py-3 pr-4">
                  {grade !== null ? (
                    <span className={`font-bold ${grade >= 70 ? "text-green-400" : "text-red-400"}`}>
                      {grade}%
                    </span>
                  ) : (
                    <span className="text-gray-500">Pending</span>
                  )}
                  {s.overrideGrade !== null && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 px-1.5 py-0.5 rounded font-medium">
                      Adjusted
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.physicsScore ?? "—"}</td>
                <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.codingScore ?? "—"}</td>
                <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.reasoningScore ?? "—"}</td>
                <td className="py-3 pr-4 text-gray-400 dark:text-gray-500 text-xs">
                  {new Date(s.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}
                </td>
                <td className="py-3 text-right">
                  {s.feedback && (
                    <button
                      onClick={() => { setExpandedId(isExpanded ? null : s.id); setOverrideForm(null); }}
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
                    <div className="prose prose-gray dark:prose-invert prose-sm max-w-none [&_p]:leading-relaxed mb-4">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>
                        {feedback}
                      </ReactMarkdown>
                    </div>

                    {overrideForm ? (
                      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex flex-col gap-2">
                        <label className="text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1">
                          Override grade (0–100)
                          <input
                            type="number" min={0} max={100} value={overrideForm.grade}
                            onChange={(e) => setOverrideForm((f) => f && { ...f, grade: e.target.value })}
                            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm w-24"
                          />
                        </label>
                        <label className="text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1">
                          Override feedback (optional — leave blank to keep the AI's feedback text)
                          <textarea
                            value={overrideForm.feedback}
                            onChange={(e) => setOverrideForm((f) => f && { ...f, feedback: e.target.value })}
                            rows={3}
                            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"
                          />
                        </label>
                        <div className="flex gap-2">
                          <button onClick={() => saveOverride(s.id)} disabled={saving}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded px-3 py-1 text-xs font-medium">
                            Save
                          </button>
                          <button onClick={() => setOverrideForm(null)}
                            className="text-gray-500 dark:text-gray-400 text-xs px-3 py-1">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3 text-xs">
                        <button onClick={() => startEditing(s)} className="text-blue-600 dark:text-blue-400 hover:text-blue-500">
                          {s.overrideGrade !== null ? "Edit override" : "Override grade"}
                        </button>
                        {s.overrideGrade !== null && (
                          <button onClick={() => clearOverride(s.id)} disabled={saving} className="text-red-500 dark:text-red-400 hover:text-red-600 disabled:opacity-50">
                            Clear override
                          </button>
                        )}
                      </div>
                    )}
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
