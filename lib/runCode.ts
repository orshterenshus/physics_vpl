export interface RunResult {
  logs: string[];
  result?: unknown;
  error?: string;
}

export function runInWorker(code: string, timeout = 10000): Promise<RunResult> {
  return new Promise((resolve) => {
    const worker = new Worker("/sandbox-worker.js");
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ logs: [], error: "Execution timed out" });
    }, timeout + 500);

    worker.onmessage = (e) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(e.data);
    };

    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ logs: [], error: e.message });
    };

    worker.postMessage({ code, timeout });
  });
}
