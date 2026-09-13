import { VITE_API_URL } from "../api/client";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const startupTasks = [
  {
    progress: 10,
    label: "🌱 Booting PlantSathi Core...",
    run: () => delay(250),
  },
  {
    progress: 25,
    label: "🌿 Loading Plant Intelligence...",
    run: () => delay(200),
  },
  {
    progress: 45,
    label: "📦 Loading User Preferences...",
    run: () => delay(250),
  },
  {
    progress: 70,
    label: "🧠 Connecting AI Assistant...",
    run: async () => {
      try {
        await fetch(`${VITE_API_URL}/health`);
      } catch (err) {
        console.log("Backend Offline");
      }
    },
  },
  {
    progress: 85,
    label: "☁️ Syncing Cloud Services...",
    run: () => delay(250),
  },
  {
    progress: 95,
    label: "⚡ Optimizing Experience...",
    run: () => delay(200),
  },
  {
    progress: 100,
    label: "🚀 Ready",
    run: () => delay(150),
  },
];
