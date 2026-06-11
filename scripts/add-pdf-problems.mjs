import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { resolve } from "path";

function readMongoUri() {
  const content = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
  const match = content.match(/^MONGODB_URI=(.+)$/m);
  if (!match) throw new Error("MONGODB_URI not found in .env.local");
  return match[1].trim();
}

const client = new MongoClient(readMongoUri());
await client.connect();
const col = client.db("physics-lab").collection("problems");

const problems = [
  // ─── Chapter 1 Problem 1 ─────────────────────────────────────────────────
  {
    chapter: 1,
    problemNumber: 1,
    title: "SI Units and Dimensional Analysis",
    description: `Assign a distinct prime number to each of the seven SI base units:

| Unit | m | kg | s | A | K | mol | Cd |
|---|---|---|---|---|---|---|---|
| Prime | 2 | 3 | 5 | 7 | 11 | 13 | 17 |

Every derived unit can be represented as a fraction of these prime numbers. In the following, $m$ represents mass (kg) and $v$ represents velocity (m/s).

### Questions

1. Find the fraction representing **acceleration** $a$, measured in m/s².
2. Find the fraction representing **force**, defined by $F = ma$ (with $m$ = mass in kg).
3. Find the fraction representing **kinetic energy**, defined by $E_k = \\frac{1}{2}mv^2$.
4. Which physical quantity is expressed by $\\frac{18}{125}$?

Write a Python script that assigns answers to questions 1–3 to variables \`A1\`, \`A2\`, \`A3\`. For question 4, write a function \`identify_unit(num, den)\` that receives two integers (numerator and denominator) and returns a string describing the physical unit. Demonstrate with $\\frac{18}{125}$.`,
    imageUrl: "",
    parameters: [
      { name: "Meter prime",    symbol: "p_m",  value: 2,  unit: "" },
      { name: "Kilogram prime", symbol: "p_kg", value: 3,  unit: "" },
      { name: "Second prime",   symbol: "p_s",  value: 5,  unit: "" },
    ],
    starterCode: `from fractions import Fraction

# Each SI base unit is assigned a distinct prime number.
# A derived unit [unit1^a * unit2^b * ...] is represented as prime1^a * prime2^b * ...
# This makes dimensional analysis purely arithmetic.

m_u   = Fraction(2)   # meter
kg_u  = Fraction(3)   # kilogram
s_u   = Fraction(5)   # second
A_u   = Fraction(7)   # ampere
K_u   = Fraction(11)  # kelvin
mol_u = Fraction(13)  # mole
cd_u  = Fraction(17)  # candela

# 1. Acceleration: [m / s^2]
A1 = m_u / s_u**2   # TODO: fill in correct expression
print(f"A1 (acceleration): {A1}")

# 2. Force: F = m*a  ->  [kg * m / s^2]
A2 = 0   # TODO
print(f"A2 (force): {A2}")

# 3. Kinetic energy: Ek = 1/2 * m * v^2  ->  [kg * m^2 / s^2]
A3 = 0   # TODO
print(f"A3 (kinetic energy): {A3}")

def identify_unit(num, den):
    """Return a string describing the physical unit for prime fraction num/den."""
    frac = Fraction(num, den)
    # Hint: factor num and den into the assigned primes and map to SI unit names
    return "unknown"

print(f"18/125 represents: {identify_unit(18, 125)}")
`,
    teacherSolution: `from fractions import Fraction

# Physical assumptions:
# Each SI base unit is assigned a unique prime number (2,3,5,...).
# A derived unit is represented as a product of prime powers — a rational fraction.
# This encoding makes dimensional analysis purely arithmetic: multiply/divide fractions.

m_u   = Fraction(2)   # meter [m]
kg_u  = Fraction(3)   # kilogram [kg]
s_u   = Fraction(5)   # second [s]
A_u   = Fraction(7)   # ampere [A]
K_u   = Fraction(11)  # kelvin [K]
mol_u = Fraction(13)  # mole [mol]
cd_u  = Fraction(17)  # candela [Cd]

# Velocity: [m/s] = m^1 * s^-1  ->  2/5
v_u = m_u / s_u

# Forces and interactions (unit relationships via Newton's laws):
# 1. Acceleration: a = dv/dt  ->  [m/s^2] = m * s^-2  ->  2/5^2 = 2/25
A1 = m_u / s_u**2
print(f"A1 (acceleration) = {A1}")   # 2/25

# 2. Force: F = m*a  ->  [kg * m * s^-2]  ->  3 * 2/25 = 6/25
A2 = kg_u * A1
print(f"A2 (force)        = {A2}")   # 6/25

# 3. Kinetic energy: Ek = 1/2*m*v^2  ->  [kg * m^2 * s^-2]  ->  3 * 4/25 = 12/25
A3 = kg_u * m_u**2 / s_u**2
print(f"A3 (kinetic energy) = {A3}")   # 12/25

# Mathematical model for identify_unit:
# Factorize numerator and denominator into the seven assigned primes.
# Translate each prime factor back to its SI unit name with exponent.

PRIME_TO_UNIT = {2: "m", 3: "kg", 5: "s", 7: "A", 11: "K", 13: "mol", 17: "Cd"}

def factor_prime(n):
    """Return dict {unit_name: exponent} for integer n."""
    result = {}
    for p, name in PRIME_TO_UNIT.items():
        while n % p == 0:
            result[name] = result.get(name, 0) + 1
            n //= p
    return result

# Known units for named lookup
KNOWN = {
    Fraction(2, 25):  "acceleration [m/s^2]",
    Fraction(6, 25):  "force [N = kg*m/s^2]",
    Fraction(12, 25): "energy [J = kg*m^2/s^2]",
    Fraction(6, 5):   "momentum [kg*m/s]",
    Fraction(12, 125):"power [W = kg*m^2/s^3]",
    Fraction(3, 50):  "pressure [Pa = kg/(m*s^2)]",
}

def identify_unit(num, den):
    """Identify the physical unit for prime fraction num/den."""
    frac = Fraction(num, den)
    if frac in KNOWN:
        return KNOWN[frac]

    # Factor numerator and denominator separately
    num_f = factor_prime(frac.numerator)
    den_f = factor_prime(frac.denominator)

    parts_num = [f"{u}" if e == 1 else f"{u}^{e}" for u, e in sorted(num_f.items())]
    parts_den = [f"{u}" if e == 1 else f"{u}^{e}" for u, e in sorted(den_f.items())]

    result = "*".join(parts_num) if parts_num else "1"
    if parts_den:
        result += " / " + "*".join(parts_den)
    return result

# Numerical method: integer factorization loop — terminates because primes are finite.
# 18/125: 18 = 2 * 3^2, 125 = 5^3  ->  m * kg^2 / s^3
print(f"identify_unit(18, 125) = {identify_unit(18, 125)}")
`,
    evaluationHints: `A1 = 2/25 (acceleration [m/s^2] = m/s^2 -> 2/5^2 = 2/25).
A2 = 6/25 (force [N] = kg*m/s^2 -> 3*2/25 = 6/25).
A3 = 12/25 (energy [J] = kg*m^2/s^2 -> 3*4/25 = 12/25).
18/125: 18 = 2*3^2, 125 = 5^3 -> m * kg^2 / s^3. Not a standard named unit.
Reward: correct fractions for A1-A3 (exact values), working identify_unit that factorizes primes and maps to unit names.`,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ─── Chapter 2 Problem 2 ─────────────────────────────────────────────────
  {
    chapter: 2,
    problemNumber: 2,
    title: "Constant Acceleration Trajectory",
    description: `A particle has a constant acceleration $\\vec{a} = a_0\\hat{x}$. At $t = 0$ the particle is located at the origin.

### Questions

1. The initial velocity of the particle is **zero**. Find its velocity vector and position vector as a function of time. What is the shape of the particle's trajectory?
2. Write a script that **plots the trajectory** for $0 < t \\leq 10$ s with $a_0 = 3$ m/s². Mark the position at $t = 2.4$ s with a printed output.
3. Suggest a prompt that can be given to an AI coding assistant to generate a **NiceGUI application** that displays the trajectory with time $t$ controlled by a slider.
4. Repeat parts 1–2 for an initial velocity $\\vec{v}(0) = v_0\\hat{y}$, with $v_0 = 2$ m/s.`,
    imageUrl: "",
    parameters: [
      { name: "Acceleration",             symbol: "a₀",    value: 3,   unit: "m/s²" },
      { name: "Initial y-velocity (Q4)",  symbol: "v₀",    value: 2,   unit: "m/s"  },
      { name: "Mark time",                symbol: "t_mark", value: 2.4, unit: "s"    },
    ],
    starterCode: `import math

a0     = 3.0    # m/s^2, constant acceleration in x-direction
t_mark = 2.4    # s, print position at this time
dt     = 0.01
t_max  = 10.0

# ── Part 1 & 2: initial velocity = 0 ────────────────────────────────────────
x, y   = 0.0, 0.0
vx, vy = 0.0, 0.0

x_data, y_data = [], []
mark_x, mark_y  = None, None
t    = 0.0
step = 0

while t <= t_max:
    ax = a0    # constant acceleration in x
    ay = 0.0

    # Forward Euler update
    vx += ax * dt
    vy += ay * dt
    x  += vx * dt
    y  += vy * dt

    if step % 10 == 0:
        x_data.append(x)
        y_data.append(y)

    if mark_x is None and t >= t_mark:
        mark_x, mark_y = x, y

    t    += dt
    step += 1

print(f"Part 2: position at t={t_mark} s -> x={mark_x:.4f} m, y={mark_y:.4f} m")
set_graph(x_data, y_data, label="Part 1: trajectory (v0=0)")

# ── Part 4: initial velocity = v0 in y-direction ────────────────────────────
v0 = 2.0    # m/s in y-direction

x4, y4     = 0.0, 0.0
vx4, vy4   = 0.0, v0

x4_data, y4_data = [], []
t    = 0.0
step = 0

while t <= t_max:
    ax4 = a0
    ay4 = 0.0

    vx4 += ax4 * dt
    vy4 += ay4 * dt
    x4  += vx4 * dt
    y4  += vy4 * dt

    if step % 10 == 0:
        x4_data.append(x4)
        y4_data.append(y4)

    t    += dt
    step += 1

# What shape is the trajectory? Hint: write x as a function of y.
print("Part 4 trajectory shape: ?")
# set_graph(x4_data, y4_data, label="Part 4: parabolic trajectory")
`,
    teacherSolution: `import math

# Physical assumptions:
# The particle has a constant force applied in the x-direction only (e.g., constant electric field).
# No force acts in y, so vy stays constant at its initial value throughout the motion.
# Unit mass is assumed (F=ma with m=1 gives a=F directly).

a0     = 3.0    # m/s^2, constant x-acceleration
t_mark = 2.4    # s
dt     = 0.001  # small step for accurate numerical integration
t_max  = 10.0

# ── Part 1 & 2: v(0) = 0 ────────────────────────────────────────────────────
# Mathematical model (analytical):
#   ax = a0, ay = 0
#   vx(t) = a0*t,  vy(t) = 0
#   x(t)  = 1/2*a0*t^2,  y(t) = 0
# Trajectory shape: straight line along x-axis (y = 0 for all t).

x, y   = 0.0, 0.0
vx, vy = 0.0, 0.0

x_data, y_data = [], []
mark_x, mark_y  = None, None
t    = 0.0
step = 0

while t <= t_max:
    # Forces and interactions: Newton's 2nd law F = m*a, constant force in x
    ax = a0
    ay = 0.0

    # Numerical method: Forward Euler
    #   v[n+1] = v[n] + a(t[n]) * dt
    #   x[n+1] = x[n] + v[n] * dt
    vx += ax * dt
    vy += ay * dt
    x  += vx * dt
    y  += vy * dt

    if step % 50 == 0:
        x_data.append(x)
        y_data.append(y)

    if mark_x is None and t >= t_mark:
        mark_x, mark_y = x, y

    t    += dt
    step += 1

x_analytical = 0.5 * a0 * t_mark**2
print(f"Part 2: t={t_mark} s -> x={mark_x:.4f} m  (analytical: {x_analytical:.4f} m)")
print(f"Part 1: trajectory is a straight line along the x-axis (y=0 always)")

# ── Part 4: v(0) = v0 * y_hat ────────────────────────────────────────────────
# Mathematical model (analytical):
#   vx(t) = a0*t, vy(t) = v0 (constant)
#   x(t)  = 1/2*a0*t^2,  y(t) = v0*t
# Eliminate t: t = y/v0  ->  x = (a0 / (2*v0^2)) * y^2
# Trajectory shape: PARABOLA opening in the +x direction.

v0 = 2.0   # m/s in y-direction
x4, y4   = 0.0, 0.0
vx4, vy4 = 0.0, v0

x4_data, y4_data = [], []
mark4_x, mark4_y = None, None
t    = 0.0
step = 0

while t <= t_max:
    ax4 = a0
    ay4 = 0.0

    vx4 += ax4 * dt
    vy4 += ay4 * dt
    x4  += vx4 * dt
    y4  += vy4 * dt

    if step % 50 == 0:
        x4_data.append(x4)
        y4_data.append(y4)

    if mark4_x is None and t >= t_mark:
        mark4_x, mark4_y = x4, y4

    t    += dt
    step += 1

print(f"Part 4: t={t_mark} s -> x={mark4_x:.4f} m, y={mark4_y:.4f} m")
print(f"Part 4: trajectory shape is a PARABOLA (x = a0/(2*v0^2) * y^2)")

# Stopping condition: simulation runs until t_max = 10 s (fixed duration).
set_graph(x4_data, y4_data, label="Part 4: parabolic trajectory (v0=2 m/s in y)")
`,
    evaluationHints: `Part 1 (v0=0): vx=a0*t, vy=0; x=0.5*a0*t^2, y=0. Trajectory is a straight line along x.
At t=2.4 s: x = 0.5*3*2.4^2 = 8.64 m, y=0.
Part 4 (v0=2 m/s in y): x=0.5*a0*t^2, y=v0*t. Eliminate t: x = (a0/2v0^2)*y^2 — a parabola.
At t=2.4: x=8.64 m, y=4.8 m.
Reward: correct analytical shapes (straight line vs parabola), correct numerical values, trajectory graph.`,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ─── Chapter 2 Problem 3 ─────────────────────────────────────────────────
  {
    chapter: 2,
    problemNumber: 3,
    title: "Boat Approaching the Dock",
    description: `A boat is approaching a dock along a straight line. From $t = 0$ onward, its velocity follows:

$$v(t) = v_0\\,e^{-\\gamma t}$$

At $t = 0$ the distance of the boat from the dock is $D$.

### Questions

1. Find the **distance** of the boat from the dock for $t > 0$.
2. Given $D$ and $\\gamma$, find the **maximal value of $v_0$** for the boat not to hit the dock.
3. Write a Python subroutine that receives $v_0$, $D$, $\\gamma$ and determines whether the boat hits the dock. It returns:
   - **"Crash"** if the boat reaches the dock
   - **"Good approach"** if minimum distance < 2 m (boat does not hit)
   - **"Too far"** if minimum distance ≥ 2 m (boat does not hit)

Demonstrate for:

| Case | $v_0$ (m/s) | $D$ (m) | $\\gamma$ (1/s) |
|---|---|---|---|
| 1 | 6 | 10 | 0.5 |
| 2 | 4.5 | 10 | 0.5 |
| 3 | 3 | 10 | 0.5 |`,
    imageUrl: "",
    parameters: [
      { name: "Initial distance",  symbol: "D",  value: 10,  unit: "m"   },
      { name: "Decay constant",    symbol: "γ",  value: 0.5, unit: "1/s" },
    ],
    starterCode: `import math

def boat_approach(v0, D, gamma):
    """
    Classify boat approach to dock.
    Returns: "Crash", "Good approach", or "Too far"
    """
    # Analytical: x(t) = D - (v0/gamma)*(1 - exp(-gamma*t))
    # As t -> inf: x_min = D - v0/gamma
    x_min = 0   # TODO: D - v0/gamma

    if x_min <= 0:
        return "Crash"
    elif x_min < 2:
        return "Good approach"
    else:
        return "Too far"

# Question 2: maximum v0 not to crash
D, gamma = 10.0, 0.5
v0_max = 0   # TODO: D * gamma
print(f"Max v0 not to crash: {v0_max} m/s")

# Question 3: demonstrate on three cases
cases = [(6.0, 10.0, 0.5), (4.5, 10.0, 0.5), (3.0, 10.0, 0.5)]
for v0, D, gamma in cases:
    print(f"v0={v0} m/s -> {boat_approach(v0, D, gamma)}")
`,
    teacherSolution: `import math

# Physical assumptions:
# The boat's velocity decays exponentially: v(t) = v0 * exp(-gamma*t).
# This is the solution to dv/dt = -gamma*v (drag proportional to velocity, m=1 assumed).
# The boat never fully stops but approaches a finite minimum distance from the dock.
# Unit mass: the decay constant gamma = b/m where b is drag coefficient.

# Mathematical model:
# Integrate v(t) to get position:
#   x(t) = D - integral_0^t v0*exp(-gamma*s) ds = D - (v0/gamma)*(1 - exp(-gamma*t))
# As t -> inf: x_inf = D - v0/gamma  (minimum distance the boat ever reaches)

def boat_approach(v0, D, gamma):
    """
    Classify boat approach using the analytical formula for minimum distance.

    Forces and interactions: the drag force F = -b*v decelerates the boat.
    With unit mass: dv/dt = -gamma*v -> v(t) = v0*exp(-gamma*t).

    Stopping condition: the boat's velocity approaches zero as t->inf.
    The minimum distance is the asymptotic limit x_inf = D - v0/gamma.
    If x_inf <= 0, the boat would "theoretically" pass through the dock -> Crash.
    """
    # Analytical minimum distance (asymptote as t -> infinity)
    x_min = D - v0 / gamma

    if x_min <= 0:
        return "Crash"
    elif x_min < 2:
        return "Good approach"
    else:
        return "Too far"

# Numerical method: evaluate the closed-form result directly (no numerical ODE needed).
# Alternative: integrate dt steps and find minimum x over time.

# Question 2: maximum v0 not to hit dock
# Condition: x_min = D - v0/gamma >= 0  ->  v0 <= D*gamma
D_ref, gamma_ref = 10.0, 0.5
v0_max = D_ref * gamma_ref
print(f"Max v0 (not to crash) = D*gamma = {D_ref}*{gamma_ref} = {v0_max} m/s")

# Question 3: three cases
cases = [
    (6.0,   10.0, 0.5),   # v0/gamma = 12 > D=10 -> Crash
    (4.5,   10.0, 0.5),   # x_min = 10-9 = 1 m < 2 -> Good approach
    (3.0,   10.0, 0.5),   # x_min = 10-6 = 4 m >= 2 -> Too far
]
for v0, D, gamma in cases:
    result = boat_approach(v0, D, gamma)
    x_min  = D - v0 / gamma
    print(f"v0={v0} m/s: x_min = {x_min:.1f} m -> {result}")

# Plot distance vs time for Case 2 to illustrate asymptotic approach
t_vals = [i * 0.1 for i in range(100)]
x_vals = [10 - (4.5/0.5)*(1 - math.exp(-0.5*t)) for t in t_vals]
set_graph(t_vals, x_vals, label="Case 2: distance from dock vs time")
`,
    evaluationHints: `Analytical distance: x(t) = D - (v0/gamma)*(1 - exp(-gamma*t)).
Minimum distance (t->inf): x_min = D - v0/gamma.
Max v0 not to crash: v0_max = D*gamma = 10*0.5 = 5 m/s.
Case 1 (v0=6): x_min = 10-12 = -2 -> Crash.
Case 2 (v0=4.5): x_min = 10-9 = 1 m < 2 -> "Good approach".
Case 3 (v0=3): x_min = 10-6 = 4 m >= 2 -> "Too far".
Numerical simulation (ODE integration) is also valid if it correctly classifies all cases.`,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ─── Chapter 3 Problem 3 ─────────────────────────────────────────────────
  {
    chapter: 3,
    problemNumber: 3,
    title: "Box on Inclined Cart",
    description: `A box of mass $m$ is given an initial velocity $v_0$ **up** the inclined plane of a cart of mass $5m$. The cart is initially at rest. The inclination angle is $\\beta$. Friction between the cart and the floor is negligible.

Given: $m = 0.6$ kg, $v_0 = 2$ m/s, $\\beta = 30°$, $g = 9.8$ m/s².

### Questions

1. What is the **initial momentum** of the system (box + cart)? Use the reference frame ($x$ rightward, $y$ upward). Assign to \`P = [Px, Py]\`.
2. Find the **velocity of the cart** at the instant when the box is momentarily at rest relative to the cart. Assign to \`V2\`.
3. Given that the cart velocity from part 2 remains constant, find the **minimum friction coefficient** between box and cart. Assign to \`mu\`.
4. Later the box slides back down. At the instant when its speed relative to the lab equals $v_0$ again, find the **velocity of the cart**. Assign to \`V3\`.
5. Is the height of the box at that moment **higher or lower** than its initial height? Assign \`"Higher"\` or \`"Lower"\` to \`A4\`.`,
    imageUrl: "",
    parameters: [
      { name: "Box mass",             symbol: "m",  value: 0.6, unit: "kg"   },
      { name: "Initial speed",        symbol: "v₀", value: 2,   unit: "m/s"  },
      { name: "Inclination angle",    symbol: "β",  value: 30,  unit: "°"    },
      { name: "Gravitational accel.", symbol: "g",  value: 9.8, unit: "m/s²" },
    ],
    starterCode: `import math

m    = 0.6                    # kg, box mass
M    = 5 * m                  # kg, cart mass
v0   = 2.0                    # m/s, initial speed up the incline
beta = math.radians(30)       # inclination angle
g    = 9.8                    # m/s^2

# Box moves up the incline: velocity components in lab frame
vx0_box = v0 * math.cos(beta)   # rightward
vy0_box = v0 * math.sin(beta)   # upward

# Part 1: initial momentum (cart at rest)
Px = m * vx0_box
Py = m * vy0_box
P  = [Px, Py]
print(f"P = [{Px:.4f}, {Py:.4f}] N*s")

# Part 2: when box is at rest relative to cart they share the same velocity.
# Only horizontal momentum is conserved (floor provides vertical normal force).
V2 = 0   # TODO: Px / (m + M)
print(f"V2 = {V2:.4f} m/s")

# Part 3: minimum friction to keep box stationary on incline while cart moves at V2
# In cart's (inertial) frame: gravity along slope vs. friction
mu = 0   # TODO: math.tan(beta)
print(f"mu = {mu:.4f}")

# Part 4: box slides back down; speed relative to lab = v0, direction DOWN the incline
vx_box_back = -v0 * math.cos(beta)   # leftward
V3 = 0   # TODO: horizontal momentum conservation
print(f"V3 = {V3:.4f} m/s")

# Part 5: compare energy at start vs end to determine height change
A4 = "?"   # "Higher" or "Lower"
print(f"A4 = {A4}")
`,
    teacherSolution: `import math

# Physical assumptions:
# System: box (m) on inclined cart (5m). Floor is frictionless -> no horizontal external force.
# The incline angle is beta = 30 deg. Box starts moving UP the incline.
# Gravity acts downward throughout. The normal force from the floor acts vertically.

m    = 0.6
M    = 5 * m                  # 3.0 kg
v0   = 2.0
beta = math.radians(30)
g    = 9.8

# Forces and interactions:
# The floor is frictionless -> zero net horizontal external force on the system.
# Therefore, horizontal momentum Px = const throughout all motion.
# Vertical momentum is NOT conserved (floor normal force is an external vertical force).
# Newton's 3rd law: box and cart exert equal and opposite normal forces on each other via incline.

vx0_box = v0 * math.cos(beta)   # rightward component
vy0_box = v0 * math.sin(beta)   # upward component

# Part 1: initial momentum P = m*v_box + M*0 (cart at rest)
Px = m * vx0_box
Py = m * vy0_box
P  = [Px, Py]
print(f"P = [{Px:.4f}, {Py:.4f}] N*s")
# Px = 0.6 * 2 * cos(30) = 0.6*sqrt(3) ~ 1.039 N*s
# Py = 0.6 * 2 * sin(30) = 0.6 N*s

# Part 2: when box and cart move together (box at rest relative to cart).
# Mathematical model: horizontal momentum conservation (only x-direction):
#   m*vx0_box + M*0 = (m + M)*V2
V2 = Px / (m + M)
print(f"V2 = {V2:.4f} m/s  (rightward, shared by both)")
# V2 = 1.039 / (0.6 + 3.0) = 1.039 / 3.6 ~ 0.2887 m/s

# Part 3: minimum friction coefficient.
# Cart moves at constant V2 -> inertial reference frame for the cart.
# Box on incline: gravity component along slope (downward) vs static friction (upward).
# N = m*g*cos(beta),  F_gravity_parallel = m*g*sin(beta)
# For equilibrium: mu * N >= F_gravity_parallel -> mu >= tan(beta)
mu = math.tan(beta)
print(f"mu = {mu:.4f}  (= tan(30 deg) = 1/sqrt(3))")

# Part 4: box slides back down; speed relative to lab = v0 again, direction DOWN incline.
# Velocity components: leftward and downward along incline
vx_box_back = -v0 * math.cos(beta)   # negative x (leftward)

# Horizontal momentum conservation:
#   m*vx0_box = m*vx_box_back + M*V3
V3 = (m * vx0_box - m * vx_box_back) / M
print(f"V3 = {V3:.4f} m/s  (rightward)")
# V3 = 2*m*v0*cos(beta) / M = 2*0.6*2*cos(30)/3.0 ~ 0.693 m/s

# Part 5: energy argument to determine height change.
# Initial KE = 1/2 * m * v0^2 (box) + 0 (cart)
# Final KE   = 1/2 * m * v0^2 (box) + 1/2 * M * V3^2 (cart)
# KE_final > KE_initial -> extra kinetic energy came from gravitational PE.
# Energy balance: KE_initial + PE_initial = KE_final + PE_final + Q_friction
# Q_friction >= 0, KE_final > KE_initial -> PE_final < PE_initial
# -> box is LOWER than its initial height.
KE_i = 0.5 * m * v0**2
KE_f = 0.5 * m * v0**2 + 0.5 * M * V3**2
print(f"Initial KE = {KE_i:.4f} J")
print(f"Final KE   = {KE_f:.4f} J  (larger -> box lost gravitational PE)")

# Stopping condition: we evaluate at the specific instant when box speed = v0 again.
A4 = "Lower"
print(f"A4 = {A4}")
print(f"Minimum height drop: (KE_f - KE_i) / (m*g) = {(KE_f-KE_i)/(m*g):.4f} m below initial")

set_graph([0, 1, 2], [Px, V2*(m+M), V3*M], label="Horizontal momentum check (should be constant)")
`,
    evaluationHints: `Part 1: Px = m*v0*cos(30) ~ 1.039 N*s, Py = m*v0*sin(30) = 0.6 N*s.
Part 2: V2 = Px / (m+M) = Px / (6m) ~ 0.289 m/s. Only HORIZONTAL momentum is conserved.
Part 3: mu_min = tan(beta) = tan(30) = 1/sqrt(3) ~ 0.577.
Part 4: V3 = 2*v0*cos(beta) / 5 ~ 0.693 m/s (rightward). Momentum still conserved.
Part 5: "Lower" — final KE exceeds initial KE, extra energy came from gravitational PE.
Common errors: conserving total (including vertical) momentum; wrong return direction for box in Part 4.`,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ─── Chapter 5 Problem 1 ─────────────────────────────────────────────────
  {
    chapter: 5,
    problemNumber: 1,
    title: "Ball-Pendulum Collision",
    description: `A small rubber ball hits a pendulum at rest at $t = 0$. The mass of the ball is $m$, the mass of the pendulum weight is $10m$. The length of the string is $\\ell$. The velocity of the ball just before impact is $v_0\\hat{x}$. Collision time is negligible. Immediately after the collision the ball's velocity is $-0.8\\,v_0\\hat{x}$.

Given: $m = 0.3$ kg, $\\ell = 0.8$ m, $g = 9.8$ m/s², $v_0 = 2.5$ m/s.

### Questions

1. What is the **maximum angular displacement** of the pendulum? Assign to \`A1\`.
2. Using the **small-angle approximation**, estimate the time at which the pendulum first reaches maximum angular displacement. Assign to \`A2\`.
3. Using the **Euler–Cromer method** with a sufficiently small time step, determine the time at which the pendulum first reaches its maximum displacement to an accuracy of 0.01 s. Assign to \`A3\`. Do both methods agree within 0.01 s? Assign \`True\` or \`False\` to \`A4\`.
4. Find the initial ball speed $v_0$ for which the small-angle approximation differs from the Euler–Cromer result by **more than 1%**. Assign to \`A5\`.`,
    imageUrl: "",
    parameters: [
      { name: "Ball mass",          symbol: "m",   value: 0.3, unit: "kg"  },
      { name: "String length",      symbol: "ℓ",   value: 0.8, unit: "m"   },
      { name: "Gravity",            symbol: "g",   value: 9.8, unit: "m/s²"},
      { name: "Ball initial speed", symbol: "v₀",  value: 2.5, unit: "m/s" },
      { name: "Rebound factor",     symbol: "r",   value: 0.8, unit: ""    },
    ],
    starterCode: `import math

m   = 0.3          # kg, ball mass
M   = 10 * m       # kg, pendulum bob mass
ell = 0.8          # m, string length
g   = 9.8          # m/s^2
v0  = 2.5          # m/s, ball speed before impact

# ── Collision: momentum conservation ────────────────────────────────────────
# Ball before: +v0,  ball after: -0.8*v0,  pendulum after: V_pend
v_ball_after = -0.8 * v0
V_pend = 0   # TODO: (m*v0 - m*v_ball_after) / M
print(f"Pendulum initial speed: {V_pend:.4f} m/s")

# ── Part 1: maximum angular displacement (energy conservation) ───────────────
# 1/2 * M * V_pend^2 = M * g * ell * (1 - cos(theta_max))
theta_max = 0   # TODO: math.acos(1 - V_pend**2 / (2*g*ell))
A1 = theta_max
print(f"A1 = {math.degrees(A1):.4f} deg")

# ── Part 2: small-angle approximation ───────────────────────────────────────
# Period: T = 2*pi*sqrt(ell/g), time to first max = T/4
T_small = 2 * math.pi * math.sqrt(ell / g)
A2 = 0   # TODO: T_small / 4
print(f"A2 = {A2:.4f} s")

# ── Part 3: Euler-Cromer simulation ─────────────────────────────────────────
# EOM: theta_ddot = -(g/ell) * sin(theta)
# Initial: theta=0, theta_dot = V_pend / ell

theta     = 0.0
theta_dot = V_pend / ell
dt        = 0.001
t         = 0.0
A3        = None

while t < 20.0:
    theta_ddot = -(g / ell) * math.sin(theta)   # exact pendulum EOM

    # Euler-Cromer: update velocity FIRST, then position
    theta_dot += theta_ddot * dt
    theta     += theta_dot  * dt
    t         += dt

    if A3 is None and theta_dot <= 0:
        A3 = t   # moment when angular velocity first hits zero = max displacement

print(f"A3 = {A3:.4f} s")
A4 = abs(A2 - A3) <= 0.01
print(f"A4 = {A4}")

# ── Part 4: find v0 for >1% disagreement ────────────────────────────────────
A5 = None
# TODO: loop over increasing v0 values until |T_small/4 - T_ec/4| / (T_small/4) > 0.01
print(f"A5 = {A5} m/s")
`,
    teacherSolution: `import math

# Physical assumptions:
# The collision is instantaneous (collision time -> 0), so momentum is conserved during impact.
# After the collision, only the pendulum bob (mass 10m) moves; the ball is irrelevant.
# The pendulum string is inextensible, string mass is negligible, pivot is fixed.
# Small-angle approximation: valid when theta_max << 1 rad (approximately < 15 deg).

m   = 0.3
M   = 10 * m       # 3.0 kg
ell = 0.8          # m
g   = 9.8
v0  = 2.5

# Forces and interactions:
# During collision: impulsive forces dominate; external forces (gravity) negligible.
# By Newton's 3rd law and momentum conservation:
#   m*v0 = m*(-0.8*v0) + M*V_pend
#   -> M*V_pend = m*v0*(1 + 0.8) = 1.8*m*v0

v_ball_after = -0.8 * v0
V_pend = (m * v0 - m * v_ball_after) / M   # = 0.18 * v0
print(f"Pendulum initial speed: {V_pend:.4f} m/s  (= 0.18 * {v0})")

# Part 1: Maximum angular displacement via energy conservation.
# Mathematical model: 1/2*M*V_pend^2 = M*g*ell*(1 - cos(theta_max))
# No energy loss after collision (pendulum is ideal).
theta_max = math.acos(1 - V_pend**2 / (2 * g * ell))
A1 = theta_max
print(f"A1 = {math.degrees(A1):.4f} deg  ({A1:.6f} rad)")

def ec_time_to_max(v0_ball, m, M, ell, g, dt=0.001):
    """
    Euler-Cromer numerical integration to find time of first maximum angular displacement.

    Numerical method: Euler-Cromer (semi-implicit Euler) updates angular velocity FIRST
    using the current angular acceleration, then updates angular position.
    This preserves energy better than plain Forward Euler for oscillatory systems.
    EOM: theta_ddot = -(g/ell)*sin(theta)

    Stopping condition: detect when theta_dot first changes sign from + to - (velocity = 0 at max).
    """
    V_p    = 0.18 * v0_ball   # from momentum conservation: 1.8*m*v0 / (10m)
    theta     = 0.0
    theta_dot = V_p / ell     # initial angular velocity [rad/s]
    t         = 0.0

    while t < 100.0:
        theta_ddot = -(g / ell) * math.sin(theta)  # exact EOM, no small-angle
        theta_dot += theta_ddot * dt   # Euler-Cromer: velocity first
        theta     += theta_dot  * dt   # then position
        t         += dt
        if theta_dot <= 0:
            return t
    return None

# Part 2: Small-angle approximation
# Period of simple pendulum (independent of amplitude in small-angle):
# T = 2*pi*sqrt(ell/g). Time to first maximum = T/4.
T_small = 2 * math.pi * math.sqrt(ell / g)
A2 = T_small / 4
print(f"A2 = {A2:.4f} s  (T={T_small:.4f} s, T/4)")

# Part 3: Euler-Cromer result
A3 = ec_time_to_max(v0, m, M, ell, g, dt=0.001)
print(f"A3 = {A3:.4f} s  (Euler-Cromer)")
A4 = abs(A2 - A3) <= 0.01
print(f"A4 = {A4}  (|{A2:.4f} - {A3:.4f}| = {abs(A2-A3):.4f} s)")

# Part 4: Find v0 where small-angle approximation differs by more than 1%.
# As v0 increases -> larger theta_max -> small-angle assumption breaks down.
A5 = None
for i in range(1, 500):
    v0_test   = i * 0.05   # try v0 from 0.05 to 25 m/s
    t_small   = T_small / 4
    t_ec      = ec_time_to_max(v0_test, m, M, ell, g, dt=0.001)
    if t_ec is None:
        break
    pct_diff  = abs(t_small - t_ec) / t_small * 100
    if pct_diff > 1.0:
        A5 = round(v0_test, 2)
        break

print(f"A5 = {A5} m/s  (>1% disagreement between methods)")

# Plot pendulum angle vs time for the given v0
theta     = 0.0
theta_dot = V_pend / ell
t_data, th_data = [], []
t = 0.0
for _ in range(5000):
    theta_ddot = -(g/ell)*math.sin(theta)
    theta_dot += theta_ddot * 0.001
    theta     += theta_dot  * 0.001
    t         += 0.001
    if _ % 5 == 0:
        t_data.append(t)
        th_data.append(math.degrees(theta))
set_graph(t_data, th_data, label="Pendulum angle vs time (deg)")
`,
    evaluationHints: `After collision: V_pend = 1.8*m*v0 / (10m) = 0.18*v0 = 0.45 m/s.
A1: cos(theta_max) = 1 - V_pend^2/(2gell) -> theta_max ~ 0.1144 rad ~ 6.55 deg.
A2: T/4 = pi/2 * sqrt(ell/g) = pi/2 * sqrt(0.8/9.8) ~ 0.449 s.
A3: Euler-Cromer gives ~0.449 s. A4 = True (theta_max is small, approximation holds).
A5: Roughly 6-7 m/s (when theta_max exceeds ~20-25 deg, small-angle error exceeds 1%).
Critical: Euler-Cromer must update velocity BEFORE position — plain Euler gives growing amplitude.
Reward: correct collision momentum balance, energy conservation for A1, correct EOM -(g/ell)*sin(theta), Euler-Cromer order.`,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

for (const problem of problems) {
  const { createdAt, ...rest } = problem;
  await col.updateOne(
    { chapter: problem.chapter, problemNumber: problem.problemNumber },
    {
      $set: { ...rest, updatedAt: new Date() },
      $setOnInsert: { createdAt },
    },
    { upsert: true }
  );
  console.log(`  Ch${problem.chapter} P${problem.problemNumber}: ${problem.title}`);
}

await client.close();
console.log("Done — 5 problems upserted.");
