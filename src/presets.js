export const PRESETS = [
  {
    name: "Classic Waves 🌊",
    description: "Simple, elegant sine waves with parameter control.",
    equations: ["a * sin(b * x + t)"],
    parameters: [
      { name: "a", value: 2, min: 0.1, max: 10, step: 0.1 },
      { name: "b", value: 1, min: 0.1, max: 5, step: 0.1 }
    ]
  },
  {
    name: "The Ghostly Signal 👻",
    description: "A fast-oscillating wave modulated by a slow one.",
    equations: ["sin(x * 10) * sin(t) * 5", "cos(x * 10) * cos(t) * 5"],
    parameters: []
  },
  {
    name: "Radio Interference 📻",
    description: "Overlapping harmonics creating complex interference patterns.",
    equations: ["sin(x) * 5", "sin(x * 1.5) * 4", "sin(x * 2) * 3"],
    parameters: []
  },
  {
    name: "Heartbeat of Chaos 💓",
    description: "A pulsating, irregular rhythm using absolute values.",
    equations: ["abs(sin(x * a + t)) * 10 * sin(x * b)"],
    parameters: [
      { name: "a", value: 2, min: 1, max: 10, step: 0.5 },
      { name: "b", value: 0.2, min: 0.1, max: 2, step: 0.1 }
    ]
  },
  {
    name: "The DNA Spiral 🧬",
    description: "Two intertwined waves resembling a double helix.",
    equations: ["sin(x + t) * 5", "sin(x + t + 3.14) * 5"],
    parameters: []
  },
  {
    name: "Warp Speed 🚀",
    description: "Exponential growth meeting sinusoidal oscillation.",
    equations: ["sin(exp(x/a)) * b"],
    parameters: [
      { name: "a", value: 2, min: 1, max: 5, step: 0.1 },
      { name: "b", value: 5, min: 1, max: 10, step: 0.5 }
    ]
  }
];
