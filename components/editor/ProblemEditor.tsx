"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { IProblem, IParameter } from "@/models/Problem";
import { useTheme } from "next-themes";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type ProblemFormData = Omit<IProblem, "_id" | "createdAt" | "updatedAt">;

interface Props {
  problem?: IProblem;
}

const DEFAULT: ProblemFormData = {
  chapter: 1,
  problemNumber: 1,
  title: "",
  description: "",
  imageUrl: "",
  parameters: [],
  starterCode: "import math\ng = 9.8\n\ndef solve():\n    pass\n\nsolve()\n",
  teacherSolution: "",
  evaluationHints: "",
};

type ActiveTab = "description" | "starter" | "solution" | "hints";

export function ProblemEditor({ problem }: Props) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [form, setForm] = useState<ProblemFormData>(problem ? { ...problem } : DEFAULT);
  const [activeTab, setActiveTab] = useState<ActiveTab>("description");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  function setField<K extends keyof ProblemFormData>(key: K, value: ProblemFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addParameter() {
    setField("parameters", [...form.parameters, { name: "", symbol: "", value: 0, unit: "" }]);
  }

  function updateParameter(i: number, key: keyof IParameter, value: string | number) {
    const updated = [...form.parameters];
    updated[i] = { ...updated[i], [key]: value };
    setField("parameters", updated);
  }

  function removeParameter(i: number) {
    setField("parameters", form.parameters.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    const url = problem ? `/api/admin/problems/${problem._id}` : "/api/problems";
    const method = problem ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) router.push("/teacher");
  }

  async function handleDelete() {
    if (!problem) return;
    if (!confirm("Delete this problem? This cannot be undone.")) return;
    await fetch(`/api/problems/${problem._id}`, { method: "DELETE" });
    router.push("/teacher");
  }

  const TABS: { id: ActiveTab; label: string }[] = [
    { id: "description", label: "Description" },
    { id: "starter", label: "Starter Code" },
    { id: "solution", label: "Teacher Solution" },
    { id: "hints", label: "Eval Hints" },
  ];

  const inputCls = "bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500";

  return (
    <div className="flex h-[calc(100vh-53px)]">
      {/* Left: form fields */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 overflow-y-auto p-5 flex flex-col gap-5 bg-white dark:bg-gray-950">
        <h2 className="font-semibold text-lg text-gray-900 dark:text-white">{problem ? "Edit Problem" : "New Problem"}</h2>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
            Chapter
            <input type="number" value={form.chapter} onChange={(e) => setField("chapter", Number(e.target.value))} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
            Problem #
            <input type="number" value={form.problemNumber} onChange={(e) => setField("problemNumber", Number(e.target.value))} className={inputCls} />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          Title
          <input type="text" value={form.title} onChange={(e) => setField("title", e.target.value)} className={inputCls} />
        </label>

        <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          Image URL
          <input type="text" value={form.imageUrl ?? ""} onChange={(e) => setField("imageUrl", e.target.value)} className={inputCls} />
        </label>

        {/* Parameters */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Parameters</span>
            <button onClick={addParameter} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500">+ Add</button>
          </div>
          <div className="flex flex-col gap-2">
            {form.parameters.map((p, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  {(["name", "symbol", "value", "unit"] as (keyof IParameter)[]).map((field) => (
                    <input
                      key={field}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      type={field === "value" ? "number" : "text"}
                      value={p[field] as string | number}
                      onChange={(e) => updateParameter(i, field, field === "value" ? Number(e.target.value) : e.target.value)}
                      className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs text-gray-900 dark:text-white"
                    />
                  ))}
                </div>
                <button onClick={() => removeParameter(i)} className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 text-right">Remove</button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            {saving ? "Saving..." : problem ? "Save Changes" : "Create Problem"}
          </button>
          {problem && (
            <button onClick={handleDelete} className="text-red-500 dark:text-red-400 hover:text-red-600 text-sm text-center">
              Delete problem
            </button>
          )}
        </div>
      </div>

      {/* Right: tabbed editor + preview */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-950">
        <div className="flex items-center border-b border-gray-200 dark:border-gray-800 px-4 gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? "border-blue-500 text-blue-600 dark:text-white"
                  : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="ml-auto">
            {activeTab === "description" && (
              <button onClick={() => setPreview((p) => !p)} className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-white px-3 py-3">
                {preview ? "Edit" : "Preview"}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {activeTab === "description" && preview ? (
            <div className="h-full overflow-y-auto p-6 prose prose-gray dark:prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {form.description}
              </ReactMarkdown>
            </div>
          ) : activeTab === "description" ? (
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              className="w-full h-full bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-mono text-sm p-4 resize-none focus:outline-none"
              placeholder="Supports Markdown and LaTeX (e.g. $F = ma$)"
            />
          ) : (
            <MonacoEditor
              height="100%"
              language={activeTab === "hints" ? "plaintext" : "python"}
              theme={isDark ? "vs-dark" : "vs"}
              value={activeTab === "starter" ? form.starterCode : activeTab === "solution" ? form.teacherSolution : form.evaluationHints}
              onChange={(v) => {
                if (activeTab === "starter") setField("starterCode", v ?? "");
                else if (activeTab === "solution") setField("teacherSolution", v ?? "");
                else setField("evaluationHints", v ?? "");
              }}
              options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true, tabSize: 4 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
