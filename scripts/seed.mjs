import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017");
await client.connect();
const db = client.db("physics-lab");
const col = db.collection("problems");

await col.deleteMany({ chapter: { $in: [2, 3, 4, 5] } });

const problems = [
  // ─── Chapter 2 Problem 1 ─────────────────────────────────────────────────
  {
    _id: new ObjectId(),
    chapter: 2,
    problemNumber: 1,
    title: "Particle Trajectory",
    description: `The acceleration of a particle as a function of time is given by:

$$\\mathbf{a}(t) = \\bigl(-2A\\omega\\sin(\\omega t) - \\omega^2 At\\cos(\\omega t)\\bigr)\\hat{x} + \\bigl(2A\\omega\\cos(\\omega t) - \\omega^2 At\\sin(\\omega t)\\bigr)\\hat{y}$$

At $t = 0$ the velocity is $\\mathbf{v}(0) = A\\hat{x}$ and the particle is at the origin.

### Questions

1. What are the dimensions of $A$ and $\\omega$? In MKS, what are their units?
2. Compute and **plot** the trajectory for $0 \\leq t < 10$ s using forward Euler integration.
3. Compute the distance of the body from the origin at $t = 7$ s.
4. When is the tangent to the trajectory first parallel to the $x$-axis?`,
    imageUrl: "",
    parameters: [
      { name: "Amplitude", symbol: "A", value: 1, unit: "m/s" },
      { name: "Angular frequency", symbol: "ω", value: 2, unit: "rad/s" },
    ],
    starterCode: `import math

A     = 1      # m/s
omega = 2      # rad/s

dt    = 0.001
t_max = 10.0

x, y   = 0.0, 0.0
vx, vy = A, 0.0

x_data, y_data = [], []

t    = 0.0
step = 0
while t <= t_max:
    # Acceleration components — fill in your formulas:
    ax = 0  # TODO
    ay = 0  # TODO

    # Forward Euler update
    vx += ax * dt
    vy += ay * dt
    x  += vx * dt
    y  += vy * dt

    if step % 50 == 0:
        x_data.append(x)
        y_data.append(y)

    t    += dt
    step += 1

set_graph(x_data, y_data, label="Trajectory")

# Question 3: distance at t = 7
print("Distance at t=7:", "?", "m")

# Question 4: when is vy = 0 for the first time after t = 0?
`,
    teacherSolution: `import math

A     = 1
omega = 2

dt    = 0.0005
t_max = 10.0

x, y   = 0.0, 0.0
vx, vy = A, 0.0

x_data, y_data = [], []
dist7          = None
first_parallel = None
prev_vy        = vy

t    = 0.0
step = 0
while t <= t_max:
    ax = -2*A*omega*math.sin(omega*t) - omega**2*A*t*math.cos(omega*t)
    ay =  2*A*omega*math.cos(omega*t) - omega**2*A*t*math.sin(omega*t)

    vx += ax * dt
    vy += ay * dt
    x  += vx * dt
    y  += vy * dt

    if step % 20 == 0:
        x_data.append(x)
        y_data.append(y)

    t_now = t + dt
    if dist7 is None and t_now >= 7:
        dist7 = math.sqrt(x**2 + y**2)
    if first_parallel is None and t > 0.01 and prev_vy * vy < 0:
        first_parallel = t_now
    prev_vy = vy

    t    += dt
    step += 1

print(f"Distance at t=7 (numerical):  {dist7:.4f} m")
print(f"Distance at t=7 (analytical): {A*7:.4f} m  [A·t = 1·7]")
if first_parallel:
    print(f"First tangent parallel to x-axis at t ≈ {first_parallel:.4f} s")

set_graph(x_data, y_data, label="Trajectory")
`,
    evaluationHints: `Analytical solution: x(t) = A·t·cos(ωt), y(t) = A·t·sin(ωt) — an Archimedean spiral.
Distance from origin = A·t, so at t=7 the answer is exactly 7 m.
Units: [A] = m/s, [ω] = rad/s.
The tangent is parallel to the x-axis when vy = 0.
Reward correct Euler loop, correct acceleration formula, correct distance, and a spiral-shaped graph.`,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ─── Chapter 3 Problem 1 ─────────────────────────────────────────────────
  {
    _id: new ObjectId(),
    chapter: 3,
    problemNumber: 1,
    title: "Bouncing Ball — Impulse",
    description: `A ball of mass $m = 0.2$ kg is released from rest at height $H = 1$ m above a table. After bouncing it reaches a maximum height of $0.6H$. Ignore air resistance.

### Questions

1. What is the impulse delivered to the ball during the collision with the table?
2. If the impact time is $\\Delta t = 5$ ms, what is the impulse of the weight of the ball during that time?
3. What is the average force acting **on the table** during impact?`,
    imageUrl: "",
    parameters: [
      { name: "Mass", symbol: "m", value: 0.2, unit: "kg" },
      { name: "Drop height", symbol: "H", value: 1, unit: "m" },
      { name: "Bounce ratio", symbol: "H₂/H", value: 0.6, unit: "" },
      { name: "Gravitational acceleration", symbol: "g", value: 9.8, unit: "m/s²" },
      { name: "Impact duration", symbol: "Δt", value: 0.005, unit: "s" },
    ],
    starterCode: `import math

m  = 0.2       # kg
H  = 1.0       # m
g  = 9.8       # m/s²
H2 = 0.6 * H  # max height after bounce
dt = 0.005     # impact time, s

# Velocity just before impact (falling from H)
v1 = 0  # TODO: downward, negative

# Velocity just after impact (rising to H2)
v2 = 0  # TODO: upward, positive

# 1. Impulse on ball = Δp
J = m * (v2 - v1)
print(f"1. Impulse on ball: {J:.4f} N·s")

# 2. Impulse of weight during impact
Jw = 0  # TODO
print(f"2. Impulse of weight: {Jw:.6f} N·s")

# 3. Average force on table (Newton's 3rd law)
# Hint: J_net on ball = J_N (table→ball, upward) − J_W (weight, downward) = m*(v2−v1)
`,
    teacherSolution: `import math

m  = 0.2
H  = 1.0
g  = 9.8
H2 = 0.6 * H
dt = 0.005

v1 = -math.sqrt(2 * g * H)   # downward
v2 =  math.sqrt(2 * g * H2)  # upward

J  = m * (v2 - v1)
print(f"1. Impulse on ball: {J:.4f} N·s")

Jw = m * g * dt
print(f"2. Impulse of weight during impact: {Jw:.6f} N·s")

# J_N − Jw = J  →  J_N = J + Jw
JN    = J + Jw
F_avg = JN / dt
print(f"3. Average force on table (Newton 3rd): {F_avg:.2f} N")
`,
    evaluationHints: `v1 = −sqrt(2gH) ≈ −4.43 m/s (downward, negative).
v2 = +sqrt(2g·0.6H) ≈ +3.43 m/s (upward, positive).
Impulse on ball J = m(v2−v1) ≈ 1.572 N·s.
Impulse of weight Jw = m·g·Δt = 0.0098 N·s (much smaller than J).
Average normal force on ball = (J + Jw)/Δt ≈ 316.4 N; by Newton's 3rd, same on table.
Watch for sign errors: v1 and v2 must have opposite signs.`,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ─── Chapter 3 Problem 2 ─────────────────────────────────────────────────
  {
    _id: new ObjectId(),
    chapter: 3,
    problemNumber: 2,
    title: "Car Acceleration with Air Drag",
    description: `A car accelerates using the maximum force available from friction. Air drag opposes motion:

$$F_{\\text{drag}} = -cv^2\\,\\hat{v}$$

Find the time required to accelerate from rest to 100 km/h.

### Question

Calculate the time required for the car to accelerate from 0 to 100 km/h using numerical integration.`,
    imageUrl: "",
    parameters: [
      { name: "Friction coefficient", symbol: "μ", value: 0.8, unit: "" },
      { name: "Drag coefficient", symbol: "c", value: 0.5, unit: "kg/m" },
      { name: "Mass", symbol: "m", value: 1300, unit: "kg" },
      { name: "Gravitational acceleration", symbol: "g", value: 10, unit: "m/s²" },
    ],
    starterCode: `mu = 0.8    # friction coefficient
c  = 0.5    # drag coefficient, kg/m
m  = 1300   # kg
g  = 10     # m/s²

v_target = 100 / 3.6   # 100 km/h → m/s
dt       = 0.001        # time step, s

F_friction = 0   # TODO: maximum friction force

v, t = 0.0, 0.0

while v < v_target:
    F_drag = 0  # TODO: air drag force
    a      = 0  # TODO: net acceleration
    v += a * dt
    t += dt

print(f"Time to 100 km/h: {t:.3f} s")
`,
    teacherSolution: `mu = 0.8
c  = 0.5
m  = 1300
g  = 10

v_target   = 100 / 3.6
F_friction = mu * m * g   # 10400 N
dt         = 0.001

v, t = 0.0, 0.0

while v < v_target:
    F_drag = c * v**2
    a      = (F_friction - F_drag) / m
    v += a * dt
    t += dt

print(f"F_friction = {F_friction:.0f} N")
print(f"Time to 100 km/h: {t:.3f} s")
`,
    evaluationHints: `Maximum friction force = μmg = 10400 N.
Drag force = c·v² (opposes motion, subtract from friction).
At 100 km/h ≈ 27.78 m/s: F_drag = 0.5 × 27.78² ≈ 385 N.
Answer ≈ 3.6 s.
Reward correct force balance and proper km/h → m/s conversion.`,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ─── Chapter 4 Problem 1 ─────────────────────────────────────────────────
  {
    _id: new ObjectId(),
    chapter: 4,
    problemNumber: 1,
    title: "Work and Conservative Forces",
    description: `Given the force:

$$\\mathbf{F} = -kx\\,\\hat{x} - \\alpha y^3\\,\\hat{y}$$

where $k = 2$ N/m, $\\alpha = 3$ N/m³, $a = 1$ m.

The body moves from the **origin** to $a\\hat{x} + a\\hat{y}$.

### Questions

1. Calculate the work done along $y = x$.
2. Calculate the work done along $y = x^2$.
3. Calculate the work done along $x = \\sin t,\\; y = 1 - \\cos t,\\quad 0 \\leq t \\leq \\pi/2$.
4. Based on parts 1–3, can you determine whether the force is conservative?
5. Is the force conservative? If so, find its potential energy and calculate $U$ at $\\mathbf{r} = 2\\hat{x} + 3\\hat{y}$ m.`,
    imageUrl: "",
    parameters: [
      { name: "Spring constant", symbol: "k", value: 2, unit: "N/m" },
      { name: "Nonlinear coefficient", symbol: "α", value: 3, unit: "N/m³" },
      { name: "End point", symbol: "a", value: 1, unit: "m" },
    ],
    starterCode: `import math

k     = 2   # N/m
alpha = 3   # N/m³
a     = 1   # m

def Fx(x, y): return -k * x
def Fy(x, y): return -alpha * y**3

N = 10000

# 1. Path y = x, from (0,0) to (a,a)
W1 = 0
for i in range(N):
    x  = (i + 0.5) * a / N
    y  = x          # y = x along this path
    dx = a / N
    dy = dx         # dy = dx since y = x
    W1 += Fx(x, y) * dx + Fy(x, y) * dy
print(f"1. Work along y=x: {W1:.4f} J")

# 2. Path y = x², from (0,0) to (a,a)
# Hint: dy = 2x dx
W2 = 0
for i in range(N):
    x  = (i + 0.5) * a / N
    y  = x**2
    dx = a / N
    dy = 0  # TODO: 2*x*dx
    W2 += Fx(x, y) * dx + Fy(x, y) * dy
print(f"2. Work along y=x²: {W2:.4f} J")

# 3. Parametric: x=sin(t), y=1−cos(t), 0 ≤ t ≤ π/2
# Hint: dx = cos(t)dt,  dy = sin(t)dt
W3 = 0
# TODO
print(f"3. Work along parametric path: {W3:.4f} J")

# 4 & 5: Is the force conservative? Find the potential energy.
`,
    teacherSolution: `import math

k     = 2
alpha = 3
a     = 1

def Fx(x, y): return -k * x
def Fy(x, y): return -alpha * y**3

N = 100000

# 1. y = x
W1 = 0
for i in range(N):
    x  = (i + 0.5) * a / N
    dx = a / N
    W1 += (Fx(x, x) + Fy(x, x)) * dx
print(f"1. Work along y=x:              {W1:.4f} J  (analytical: -1.75)")

# 2. y = x²
W2 = 0
for i in range(N):
    x  = (i + 0.5) * a / N
    dx = a / N
    W2 += Fx(x, x**2) * dx + Fy(x, x**2) * (2 * x * dx)
print(f"2. Work along y=x²:             {W2:.4f} J  (analytical: -1.75)")

# 3. Parametric
t_max = math.pi / 2
W3 = 0
for i in range(N):
    t  = (i + 0.5) * t_max / N
    dt = t_max / N
    x  = math.sin(t)
    y  = 1 - math.cos(t)
    W3 += (Fx(x, y) * math.cos(t) + Fy(x, y) * math.sin(t)) * dt
print(f"3. Work along parametric path:  {W3:.4f} J  (analytical: -1.75)")

print()
print("4. All three paths give the same work → force IS conservative.")

# 5. F = −∇U  →  U = kx²/2 + αy⁴/4
U = k * 4 / 2 + alpha * 81 / 4
print(f"5. U(2, 3) = {U:.4f} J")
`,
    evaluationHints: `All three paths give W = −7/4 = −1.75 J (path-independent → conservative).
Path 1 analytical: ∫₀¹(−2x − 3x³)dx = −1 − 3/4 = −1.75.
Potential energy: U = kx²/2 + αy⁴/4. At (2,3): U = 4 + 60.75 = 64.75 J.
Key check: ∂Fx/∂y = 0, ∂Fy/∂x = 0  →  curl F = 0 confirms conservative.
Reward path-independence observation and correct potential function.`,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ─── Chapter 5 Problem 1 ─────────────────────────────────────────────────
  {
    _id: new ObjectId(),
    chapter: 5,
    problemNumber: 1,
    title: "Bead on a Hoop",
    description: `A bead is threaded onto a frictionless hoop of radius $R$. At $t = 0$ the bead is at the **top** of the hoop and is given an initial velocity $\\sqrt{gR}$ to the right.

Let $\\alpha$ be the angle measured clockwise from the top. The equation of motion is:

$$\\ddot{\\alpha} = \\frac{g}{R}\\sin\\alpha$$

### Questions

1. Write the equation of motion for the bead (done above — explain the derivation).
2. Solve numerically using the **Euler–Cromer** method.
3. When does the bead first reach the bottom of the hoop ($\\alpha = \\pi$)?`,
    imageUrl: "",
    parameters: [
      { name: "Hoop radius", symbol: "R", value: 1, unit: "m" },
      { name: "Gravitational acceleration", symbol: "g", value: 9.8, unit: "m/s²" },
    ],
    starterCode: `import math

R = 1.0    # m
g = 9.8    # m/s²

# alpha = 0: top of hoop,  alpha = π: bottom
alpha     = 0.0
alpha_dot = math.sqrt(g / R)   # initial angular velocity (rightward)

dt    = 0.001
t_max = 20.0

x_data, y_data = [], []
t        = 0.0
t_bottom = None
step     = 0

while t < t_max:
    # Equation of motion
    alpha_ddot = 0  # TODO: (g/R) * sin(alpha)

    # Euler-Cromer: update velocity FIRST, then position
    alpha_dot += alpha_ddot * dt
    alpha     += alpha_dot  * dt
    t         += dt
    step      += 1

    if step % 10 == 0:
        x_data.append(R * math.sin(alpha))
        y_data.append(R * math.cos(alpha))

    if t_bottom is None and alpha >= math.pi:
        t_bottom = t

if t_bottom:
    print(f"Time to reach bottom: {t_bottom:.4f} s")
else:
    print("Bottom not reached within", t_max, "s")

set_graph(x_data, y_data, label="Position on hoop")
`,
    teacherSolution: `import math

R = 1.0
g = 9.8

alpha     = 0.0
alpha_dot = math.sqrt(g / R)

dt    = 0.0005
t_max = 20.0

x_data, y_data = [], []
t        = 0.0
t_bottom = None
step     = 0

while t < t_max:
    alpha_ddot = (g / R) * math.sin(alpha)

    # Euler-Cromer: velocity first (better energy conservation)
    alpha_dot += alpha_ddot * dt
    alpha     += alpha_dot  * dt
    t         += dt
    step      += 1

    if step % 20 == 0:
        x_data.append(R * math.sin(alpha))
        y_data.append(R * math.cos(alpha))

    if t_bottom is None and alpha >= math.pi:
        t_bottom = t

print(f"Time to reach bottom: {t_bottom:.4f} s")
print(f"Speed at bottom (numerical):  {R * abs(alpha_dot):.4f} m/s")
print(f"Speed at bottom (analytical): {math.sqrt(5 * g * R):.4f} m/s")

set_graph(x_data, y_data, label="Trajectory on hoop")
`,
    evaluationHints: `EOM from Lagrangian: T = ½mR²α̇², V = mgR·cos(α) → α̈ = (g/R)sin(α).
Initial: α(0)=0, α̇(0) = √(g/R).
Euler-Cromer: velocity updated before position (semi-implicit, better energy conservation than plain Euler).
Speed at bottom (analytical) = √(5gR) ≈ 7.0 m/s — use as energy check.
Time to bottom ≈ 1.0–1.1 s (accept numerical result within 5%).
Graph should show a circular arc from top to bottom.`,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const result = await col.insertMany(problems);
console.log(`Inserted ${result.insertedCount} problems.`);

await client.close();
