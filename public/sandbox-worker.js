const PHYSICS_LIB = `
const physics = {
  distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  },
  eulerStep(position, velocity, acceleration, dt) {
    return {
      position: position + velocity * dt,
      velocity: velocity + acceleration * dt,
    };
  },
  degToRad(deg) { return (deg * Math.PI) / 180; },
  radToDeg(rad) { return (rad * 180) / Math.PI; },
  kineticEnergy(mass, velocity) { return 0.5 * mass * velocity ** 2; },
  potentialEnergy(mass, g, height) { return mass * g * height; },
  momentum(mass, velocity) { return mass * velocity; },
};
`;

self.onmessage = function (e) {
  const { code, timeout = 10000 } = e.data;
  const logs = [];
  let graphData = null;

  const timer = setTimeout(() => {
    self.postMessage({ error: "Execution timed out (10s limit)", logs });
  }, timeout);

  // Override console before eval so it applies regardless of how student code is structured.
  // This works because eval inherits the local scope.
  self.console = {
    log: (...args) => logs.push(args.map(String).join(" ")),
    error: (...args) => logs.push("[error] " + args.map(String).join(" ")),
    warn: (...args) => logs.push("[warn] " + args.map(String).join(" ")),
  };

  // Expose a graph output mechanism students call explicitly instead of relying on return value capture
  self.setGraph = (data) => { graphData = data; };

  try {
    // Prepend physics lib as source text — this is safe because PHYSICS_LIB is a
    // trusted constant defined above, not user input. The student code is evaluated
    // separately via indirect eval which runs in the worker global scope.
    const fullCode = PHYSICS_LIB + "\n" + code;
    // Indirect eval (via (0, eval)) runs in global scope, not local scope.
    // This is intentional: we want student code at global scope so top-level
    // declarations work as expected. console and setGraph are already on self.
    (0, eval)(fullCode); // eslint-disable-line no-eval
    clearTimeout(timer);
    self.postMessage({ logs, graph: graphData });
  } catch (err) {
    clearTimeout(timer);
    self.postMessage({ error: err.message, logs });
  }
};
