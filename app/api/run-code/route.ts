import { NextResponse } from "next/server";
import { spawn } from "child_process";

const PYTHON = process.env.PYTHON_CMD ?? (process.platform === "win32" ? "python" : "python3");

const PHYSICS_PY = `
import math

class _Physics:
    def distance(self, x1, y1, x2, y2):
        return math.sqrt((x2-x1)**2 + (y2-y1)**2)

    def euler_step(self, position, velocity, acceleration, dt):
        return position + velocity*dt, velocity + acceleration*dt

    def deg_to_rad(self, deg):
        return deg * math.pi / 180

    def rad_to_deg(self, rad):
        return rad * 180 / math.pi

    def kinetic_energy(self, mass, velocity):
        return 0.5 * mass * velocity**2

    def potential_energy(self, mass, g, height):
        return mass * g * height

    def momentum(self, mass, velocity):
        return mass * velocity

physics = _Physics()
_graph_data = None

def set_graph(x, y, label="result"):
    global _graph_data
    _graph_data = {"x": list(x), "y": list(y), "label": label}
`;

export async function POST(req: Request) {
  const { code, language } = await req.json();

  if (language === "javascript") {
    return NextResponse.json({ error: "JavaScript runs client-side." }, { status: 400 });
  }

  if (language !== "python") {
    return NextResponse.json({ error: "Unsupported language." }, { status: 400 });
  }

  const fullCode = `
import json, sys, io, traceback

${PHYSICS_PY}

_output_lines = []
_original_print = print

def _capture_print(*args, **kwargs):
    sep = kwargs.get("sep", " ")
    end = kwargs.get("end", "\\n")
    _output_lines.append(sep.join(str(a) for a in args))

print = _capture_print

try:
${code.split("\n").map((l: string) => "    " + l).join("\n")}
except Exception as e:
    _output_lines.append(f"[error] {traceback.format_exc()}")

_result = {"logs": _output_lines, "graph": _graph_data}
_original_print(json.dumps(_result))
`;

  return new Promise<NextResponse>((resolve) => {
    const proc = spawn(PYTHON, ["-c", fullCode], {
      timeout: 10000,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      if (code !== 0 || !stdout.trim()) {
        resolve(NextResponse.json({
          logs: stderr ? [stderr.trim()] : [],
          error: "Execution failed or timed out",
          graph: null,
        }));
        return;
      }
      try {
        const result = JSON.parse(stdout.trim());
        resolve(NextResponse.json(result));
      } catch {
        resolve(NextResponse.json({ logs: [stdout.trim()], graph: null }));
      }
    });

    proc.on("error", (err) => {
      resolve(NextResponse.json({ logs: [], error: err.message, graph: null }));
    });
  });
}
