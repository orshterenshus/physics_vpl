# Q1 Examples for Grading

## Problem

The acceleration of a particle as a function of time is given by:

$$\mathbf{a}(t) = \bigl(-2A\omega\sin(\omega t) - \omega^2 At\cos(\omega t)\bigr)\hat{x} + \bigl(2A\omega\cos(\omega t) - \omega^2 At\sin(\omega t)\bigr)\hat{y}$$

At $t = 0$ the velocity is $\mathbf{v}(0) = A\hat{x}$ and the particle is at the origin.

**Questions:**
1. What are the dimensions of $A$ and $\omega$? In MKS, what are their units?
2. Compute and **plot** the trajectory for $0 \leq t < 10$ s using forward Euler integration.
3. Compute the distance of the body from the origin at $t = 7$ s.
4. When is the tangent to the trajectory first parallel to the $x$-axis?

---

## Grading Rubric

| Category | Weight | What earns 100 | What loses points |
|---|---|---|---|
| Physics | 40% | Correct acceleration formula, correct initial conditions | Wrong formula, missing physics, wrong constants |
| Coding | 40% | Code produces correct numerical results using valid method | Wrong results, wrong method, bad loop bounds |
| Reasoning | 20% | Comments cover all 5 aspects (see below) | Each missing aspect drops the score by 20 points |

**5 reasoning aspects:**
1. Physical assumptions (units of A and ω, model simplifications)
2. Forces and interactions (Newton's law, acceleration explanation)
3. Mathematical model (equations/formulas explained)
4. Numerical method (Forward Euler named and explained)
5. Stopping condition (how/why the simulation ends or detects the answer)

**Reasoning score:** 5 aspects = 100, 4 = 80, 3 = 60, 2 = 40, 1 = 20, 0 = 0

---

## Example 1 — Expected Score ~100

**Errors:** None  
**Comments:** All 5 aspects covered  
**Expected breakdown:** Physics 100 / Coding 100 / Reasoning 100 → **Grade: 100**

```python
import numpy as np

# A has dimensions of velocity [m/s in MKS] since v(0) = A*x_hat must be in m/s.
# omega has dimensions of angular frequency [rad/s in MKS].
# Arbitrary values are used here — the trajectory shape (Archimedean spiral) is universal.
A = 1
omega = 2

dt = 0.0005  # Small enough that Forward Euler error is negligible for this smooth problem
t_max = 10.0

t = np.arange(0, t_max + dt, dt)
n = len(t)

x  = np.zeros(n)
y  = np.zeros(n)
vx = np.zeros(n)
vy = np.zeros(n)

vx[0] = A   # initial velocity = A in x-direction, vy(0) = 0
vy[0] = 0.0

# Forward Euler integration — explicit first-order method:
#   v[n+1] = v[n] + a(t[n]) * dt   (velocity updated with acceleration at current step)
#   r[n+1] = r[n] + v[n] * dt      (position updated with velocity at current step)
# Based on Newton's second law F = m*a, with unit mass assumed.
# Acceleration given:
#   ax(t) = -2*A*omega*sin(omega*t) - omega^2*A*t*cos(omega*t)
#   ay(t) =  2*A*omega*cos(omega*t) - omega^2*A*t*sin(omega*t)
for i in range(n - 1):
    ax = -2*A*omega*np.sin(omega*t[i]) - omega**2*A*t[i]*np.cos(omega*t[i])
    ay =  2*A*omega*np.cos(omega*t[i]) - omega**2*A*t[i]*np.sin(omega*t[i])
    vx[i+1] = vx[i] + ax * dt
    vy[i+1] = vy[i] + ay * dt
    x[i+1]  = x[i]  + vx[i] * dt
    y[i+1]  = y[i]  + vy[i] * dt

# Euclidean distance from origin: sqrt(x^2 + y^2)
idx7 = int(7.0 / dt)
dist7 = np.sqrt(x[idx7]**2 + y[idx7]**2)

# Tangent is parallel to x-axis when vy = 0 (no y-component of velocity).
# Detect first sign change in vy after t=0 and linearly interpolate for accuracy.
first_parallel = None
for i in range(1, n):
    if vy[i-1] * vy[i] < 0:
        first_parallel = t[i-1] + abs(vy[i-1]) / (abs(vy[i-1]) + abs(vy[i])) * dt
        break

print(f"Distance at t=7 (numerical): {dist7:.4f} m")
if first_parallel is not None:
    print(f"First tangent parallel to x-axis at t ≈ {first_parallel:.4f} s")

set_graph(x[::20], y[::20], label="Trajectory")
```

**Why this scores ~100:**
- **Physics (100):** Both `ax` and `ay` formulas are correct. Forward Euler applied at the current time step `t[i]`.
- **Coding (100):** Velocity is updated before position (correct Forward Euler order). Distance uses `sqrt(x²+y²)`. Stopping condition correctly detects sign change in `vy`.
- **Reasoning (100 — 5/5 aspects):**
  1. ✅ Physical assumptions — explains A is m/s, ω is rad/s, values are arbitrary, trajectory is an Archimedean spiral
  2. ✅ Forces and interactions — mentions Newton's second law F=ma with unit mass
  3. ✅ Mathematical model — writes out both ax and ay equations in comments
  4. ✅ Numerical method — names Forward Euler, writes out the two update rules explicitly, justifies step size
  5. ✅ Stopping condition — explains vy=0 means tangent parallel to x-axis, explains sign-change detection and linear interpolation

---

## Example 2 — Expected Score ~80

**Errors:** Sign error in `ay` (first term is `-2Aω cos` instead of `+2Aω cos`)  
**Comments:** 3/5 aspects covered  
**Expected breakdown:** Physics ~75 / Coding 100 / Reasoning 60 → **Grade: ~82**

```python
import numpy as np

# A and omega are arbitrary constants for this problem
A = 1
omega = 2

dt = 0.0005
t_max = 10.0

t = np.arange(0, t_max + dt, dt)
n = len(t)

x  = np.zeros(n)
y  = np.zeros(n)
vx = np.zeros(n)
vy = np.zeros(n)

vx[0] = A
vy[0] = 0.0

# Forward Euler integration
for i in range(n - 1):
    ax = -2*A*omega*np.sin(omega*t[i]) - omega**2*A*t[i]*np.cos(omega*t[i])
    ay = -2*A*omega*np.cos(omega*t[i]) - omega**2*A*t[i]*np.sin(omega*t[i])  # BUG: should be +2*A*omega*cos(...)
    vx[i+1] = vx[i] + ax * dt
    vy[i+1] = vy[i] + ay * dt
    x[i+1]  = x[i]  + vx[i] * dt
    y[i+1]  = y[i]  + vy[i] * dt

# Distance from origin at t=7
idx7 = int(7.0 / dt)
dist7 = np.sqrt(x[idx7]**2 + y[idx7]**2)

# Find when vy changes sign — tangent becomes parallel to x-axis
first_parallel = None
for i in range(1, n):
    if vy[i-1] * vy[i] < 0:
        first_parallel = t[i]
        break

print(f"Distance at t=7 (numerical): {dist7:.4f} m")
if first_parallel is not None:
    print(f"First tangent parallel to x-axis at t ≈ {first_parallel:.4f} s")

set_graph(x[::20], y[::20], label="Trajectory")
```

**Why this scores ~80:**
- **Physics (~75):** `ax` is correct but `ay` has a sign error on the first term. The correct formula is `+2Aω cos(ωt)` but the student wrote `-2Aω cos(ωt)`. This is a key formula error → deduction of ~25 points.
- **Coding (100):** The code correctly implements the (wrong) formula. Forward Euler order is correct. Distance and stopping condition logic are implemented correctly.
- **Reasoning (60 — 3/5 aspects):**
  1. ✅ Physical assumptions — mentions "arbitrary constants"
  2. ❌ Forces and interactions — no mention of Newton's law or what the acceleration represents physically
  3. ❌ Mathematical model — equations are not written out or explained in comments
  4. ✅ Numerical method — "Forward Euler" is named
  5. ✅ Stopping condition — explains vy changes sign

---

## Example 3 — Expected Score <60

**Errors:** Acceleration evaluated only at t=0 (treated as constant throughout), wrong distance formula, wrong stopping condition  
**Comments:** 1/5 aspects covered  
**Expected breakdown:** Physics ~45 / Coding ~40 / Reasoning 20 → **Grade: ~38**

```python
import numpy as np

A = 1
omega = 2

dt = 0.0005
t_max = 10.0

t = np.arange(0, t_max + dt, dt)
n = len(t)

x  = np.zeros(n)
y  = np.zeros(n)
vx = np.zeros(n)
vy = np.zeros(n)

vx[0] = A
vy[0] = 0.0

# compute acceleration
ax = -2*A*omega*np.sin(omega*0) - omega**2*A*0*np.cos(omega*0)
ay =  2*A*omega*np.cos(omega*0) - omega**2*A*0*np.sin(omega*0)

# Euler integration
for i in range(n - 1):
    vx[i+1] = vx[i] + ax * dt   # ax and ay are constant — never updated inside the loop
    vy[i+1] = vy[i] + ay * dt
    x[i+1]  = x[i]  + vx[i] * dt
    y[i+1]  = y[i]  + vy[i] * dt

# distance at t=7
idx7 = int(7.0 / dt)
dist7 = x[idx7] + y[idx7]   # BUG: should be sqrt(x^2 + y^2)

# find parallel tangent
first_parallel = None
for i in range(1, n):
    if vx[i] < 0:   # BUG: should check vy, not vx
        first_parallel = t[i]
        break

print(f"Distance at t=7 (numerical): {dist7:.4f} m")
if first_parallel is not None:
    print(f"First tangent parallel to x-axis at t ≈ {first_parallel:.4f} s")

set_graph(x[::20], y[::20], label="Trajectory")
```

**Why this scores <60:**
- **Physics (~45):** The acceleration `ax` and `ay` are computed once at `t=0` and never updated inside the loop. This treats `a(t)` as a constant, which is completely wrong — the entire problem is about time-varying acceleration. This is the fundamental physical model error: deduction of ~35–40 points.
- **Coding (~40):** Because the physics is wrong, the trajectory, distance, and stopping condition all give incorrect results. Additionally, `dist7 = x + y` is not the Euclidean distance, and `vx < 0` does not detect when the tangent is parallel to the x-axis.
- **Reasoning (20 — 1/5 aspects):**
  1. ❌ Physical assumptions — no explanation of what A or ω represent
  2. ❌ Forces and interactions — no explanation of the physics
  3. ❌ Mathematical model — no equations explained
  4. ✅ Numerical method — "Euler integration" is mentioned
  5. ❌ Stopping condition — no explanation of what the stopping condition means physically

---

## Example 4 — Expected Score ~40

**Errors:** Wrong physical model (uses 2D harmonic oscillator instead of given formula), wrong Euler order (position before velocity), stopping condition uses exact float equality so it never triggers  
**Comments:** None at all  
**Expected breakdown:** Physics ~45 / Coding ~50 / Reasoning 0 → **Grade: ~38**

```python
import numpy as np

A = 1
omega = 2

dt = 0.0005
t_max = 10.0

t = np.arange(0, t_max + dt, dt)
n = len(t)

x  = np.zeros(n)
y  = np.zeros(n)
vx = np.zeros(n)
vy = np.zeros(n)

vx[0] = A
vy[0] = 0.0

for i in range(n - 1):
    ax = -omega**2 * x[i]   # WRONG: this is a 2D harmonic oscillator (circular motion around origin)
    ay = -omega**2 * y[i]   # the given formula is completely different and time-dependent
    x[i+1]  = x[i]  + vx[i] * dt   # WRONG ORDER: position updated before velocity
    y[i+1]  = y[i]  + vy[i] * dt   # correct Forward Euler updates velocity first
    vx[i+1] = vx[i] + ax * dt
    vy[i+1] = vy[i] + ay * dt

idx7 = int(7.0 / dt)
dist7 = np.sqrt(x[idx7]**2 + y[idx7]**2)

first_parallel = None
for i in range(1, n):
    if vy[i] == 0:   # WRONG: floating point values are never exactly 0, this never triggers
        first_parallel = t[i]
        break

print(f"Distance at t=7 (numerical): {dist7:.4f} m")
if first_parallel is not None:
    print(f"First tangent parallel to x-axis at t ≈ {first_parallel:.4f} s")

set_graph(x[::20], y[::20], label="Trajectory")
```

**Why this scores ~40:**
- **Physics (~45):** The student replaced the given time-varying acceleration formula entirely with `ax = -ω²x`, `ay = -ω²y`. This is the equation of a 2D harmonic oscillator (circular motion restoring force) — a completely different physical model that ignores the problem statement. The given formula is explicitly provided and must be used. Deduction: ~-40 to -55 (completely wrong model + required physical effect missing).
- **Coding (~50):** Position is updated before velocity in the loop — the correct Forward Euler order is velocity first, then position. The stopping condition `vy[i] == 0` uses exact float equality, which due to floating-point arithmetic will almost never be exactly zero. The simulation will always print `None` for question 4. Multiple implementation errors that produce wrong results.
- **Reasoning (0 — 0/5 aspects):** No comments anywhere in the "#your code" section. Zero aspects covered.
  1. ❌ Physical assumptions
  2. ❌ Forces and interactions
  3. ❌ Mathematical model
  4. ❌ Numerical method
  5. ❌ Stopping condition
