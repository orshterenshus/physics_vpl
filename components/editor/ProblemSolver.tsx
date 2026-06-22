"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { GraphPanel } from "./GraphPanel";
import { IProblem, IParameter } from "@/models/Problem";
import { useTheme } from "next-themes";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Props {
  problem: IProblem;
}

interface RunResult {
  logs: string[];
  graph?: { x: number[]; y: number[]; label?: string } | null;
  error?: string;
}

export function ProblemSolver({ problem }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [code, setCode] = useState(
    problem.starterCode || "import math\ng = 9.8\n\ndef solve():\n    pass\n\nsolve()\n"
  );
  const [output, setOutput] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<{
    grade: number | null;
    feedback: string;
    physicsScore: number | null;
    codingScore: number | null;
    reasoningScore: number | null;
  } | null>(null);

  const [panelWidth, setPanelWidth] = useState(380);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizing = useRef(false);

  const [outputHeight, setOutputHeight] = useState(224);
  const editorColumnRef = useRef<HTMLDivElement>(null);
  const resizingOutput = useRef(false);

  const startResize = useCallback(() => {
    resizing.current = true;
  }, []);

  const startResizeOutput = useCallback(() => {
    resizingOutput.current = true;
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (resizing.current && containerRef.current) {
        const left = containerRef.current.getBoundingClientRect().left;
        const width = e.clientX - left;
        setPanelWidth(Math.min(900, Math.max(280, width)));
      }
      if (resizingOutput.current && editorColumnRef.current) {
        const bottom = editorColumnRef.current.getBoundingClientRect().bottom;
        const height = bottom - e.clientY;
        setOutputHeight(Math.min(700, Math.max(120, height)));
      }
    };
    const onMouseUp = () => {
      resizing.current = false;
      resizingOutput.current = false;
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setOutput(null);
    const res = await fetch("/api/run-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language: "python" }),
    });
    setOutput(await res.json());
    setRunning(false);
  }, [code]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    const executionOutput = output
      ? [...output.logs, output.error ?? ""].filter(Boolean).join("\n")
      : "";

    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId: problem._id, sourceCode: code, executionOutput }),
    });

    if (!res.ok) { setSubmitting(false); return; }

    const { submissionId } = await res.json();
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      const r = await fetch(`/api/submissions/${submissionId}`);
      if (r.ok) {
        const s = await r.json();
        if (s.grade !== null || attempts >= 30) {
          clearInterval(poll);
          setSubmission(s);
          setSubmitting(false);
        }
      } else {
        clearInterval(poll);
        setSubmitting(false);
      }
    }, 2000);
  }, [code, output, problem._id]);

  return (
    <div ref={containerRef} className="flex h-[calc(100vh-53px)]">
      {/* Left panel: problem statement */}
      <div style={{ width: panelWidth }}
        className="flex-shrink-0 overflow-y-auto p-6 flex flex-col gap-6 bg-white dark:bg-gray-950">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
            Chapter {problem.chapter} · #{problem.problemNumber}
          </p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{problem.title}</h1>
        </div>

        {problem.imageUrl && (
          <img src={problem.imageUrl} alt="Problem diagram"
            className="rounded-lg border border-gray-200 dark:border-gray-700 w-full" />
        )}

        <div className="prose prose-gray dark:prose-invert prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {problem.description}
          </ReactMarkdown>
        </div>

        {problem.parameters.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              Parameters
            </h3>
            <div className="flex flex-col gap-2">
              {problem.parameters.map((p: IParameter, i: number) => (
                <div key={i}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-300">
                    {p.name} <span className="text-gray-400 dark:text-gray-500">({p.symbol})</span>
                  </span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    {p.value} <span className="text-gray-400 dark:text-gray-500">{p.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {submission && (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900 dark:text-white">Grade</span>
              <span className={`text-2xl font-bold ${
                (submission.grade ?? 0) >= 70
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
                {submission.grade !== null ? `${submission.grade}%` : "Pending..."}
              </span>
            </div>
            {submission.grade !== null && (
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {([["Physics", submission.physicsScore], ["Code", submission.codingScore], ["Reasoning", submission.reasoningScore]] as [string, number | null][]).map(([label, score]) => (
                  <div key={label} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                    <div className="text-blue-600 dark:text-blue-400 font-bold">{score}</div>
                    <div className="text-gray-500">{label}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="prose prose-gray dark:prose-invert prose-sm max-w-none [&_p]:leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>
                {submission.feedback}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={startResize}
        className="w-1 flex-shrink-0 cursor-col-resize bg-gray-200 dark:bg-gray-800 hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors"
      />

      {/* Right panel: editor + output */}
      <div ref={editorColumnRef} className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 min-h-0">
          <MonacoEditor
            height="100%"
            language="python"
            theme={isDark ? "vs-dark" : "vs"}
            value={code}
            onChange={(v) => setCode(v ?? "")}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
            }}
          />
        </div>

        {/* Vertical drag handle */}
        <div
          onMouseDown={startResizeOutput}
          className="h-1 flex-shrink-0 cursor-row-resize bg-gray-200 dark:bg-gray-800 hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors"
        />

        <div style={{ height: outputHeight }}
          className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800">
            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">Output</span>
            <div className="flex gap-2">
              <button onClick={handleRun} disabled={running}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 rounded px-3 py-1 text-xs font-medium transition-colors text-gray-800 dark:text-gray-200">
                {running ? "Running..." : "Run"}
              </button>
              <button onClick={handleSubmit} disabled={submitting || running}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded px-3 py-1 text-xs font-medium text-white transition-colors">
                {submitting ? "Grading..." : "Submit"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex">
            <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs">
              {output?.error && <div className="text-red-600 dark:text-red-400 mb-2">{output.error}</div>}
              {output?.logs.map((line, i) => (
                <div key={i} className="text-gray-700 dark:text-gray-300">{line}</div>
              ))}
              {!output && !running && (
                <span className="text-gray-400 dark:text-gray-600">Press Run to execute your code.</span>
              )}
            </div>
            {output?.graph && (
              <div className="w-72 h-full border-l border-gray-200 dark:border-gray-800">
                <GraphPanel data={output.graph} isDark={isDark} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
