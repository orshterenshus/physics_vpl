export const PHYSICS_LIB = `
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
  degToRad(deg) {
    return (deg * Math.PI) / 180;
  },
  radToDeg(rad) {
    return (rad * 180) / Math.PI;
  },
  kineticEnergy(mass, velocity) {
    return 0.5 * mass * velocity ** 2;
  },
  potentialEnergy(mass, g, height) {
    return mass * g * height;
  },
  momentum(mass, velocity) {
    return mass * velocity;
  },
};
`;
