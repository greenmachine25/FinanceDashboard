/**
 * Utility functions, formatters, color palettes, and data export/import helpers
 */

export const colorMap = {
  "bg-rose-500": "#f43f5e",
  "bg-red-500": "#ef4444",
  "bg-orange-500": "#f97316",
  "bg-amber-500": "#f59e0b",
  "bg-yellow-400": "#facc15",
  "bg-lime-500": "#84cc16",
  "bg-emerald-500": "#10b981",
  "bg-teal-500": "#14b8a6",
  "bg-cyan-500": "#06b6d4",
  "bg-sky-500": "#0ea5e9",
  "bg-blue-500": "#3b82f6",
  "bg-indigo-500": "#6366f1",
  "bg-violet-500": "#8b5cf6",
  "bg-purple-500": "#a855f7",
  "bg-fuchsia-500": "#d946ef",
  "bg-pink-500": "#ec4899",
};

export const cardColors = Object.keys(colorMap);

export function getRandomColor(excludeColor = null) {
  const colors = cardColors.filter((c) => c !== excludeColor);
  return colors[Math.floor(Math.random() * colors.length)] || "bg-teal-500";
}

export const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const fmtInt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function parseNum(val) {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const parsed = parseFloat(val.toString().replace(/[^0-9.-]+/g, ""));
  return isNaN(parsed) ? 0 : parsed;
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

export function exportDataAsJSON(data, filename = `financehub_backup_${Date.now()}.json`) {
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportDataAsSyncCode(data) {
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

export function parseSyncCode(code) {
  if (!code || typeof code !== "string") return null;
  try {
    return JSON.parse(decodeURIComponent(atob(code.trim())));
  } catch (err) {
    console.error("Failed to decode sync code:", err);
    return null;
  }
}
