/**
 * Utility functions, formatters, sanitizers, and data export/import helpers
 */

export const APP_VERSION = "0.15";

export const colorMap = {
  "bg-emerald-500": "#10b981",
  "bg-teal-500": "#14b8a6",
  "bg-cyan-500": "#06b6d4",
  "bg-sky-500": "#0ea5e9",
  "bg-blue-500": "#3b82f6",
  "bg-indigo-500": "#6366f1",
  "bg-violet-500": "#8b5cf6",
  "bg-purple-500": "#a855f7",
  "bg-fuchsia-500": "#d946ef",
  "bg-slate-700": "#334155",
};

export const cardColors = Object.keys(colorMap);

export function getRandomColor(excludeColor = null) {
  const colors = cardColors.filter((c) => c !== excludeColor);
  return colors[Math.floor(Math.random() * colors.length)] || "bg-teal-500";
}

export const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const fmtPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Smooth Animated Number Counter for Large KPI Values
 */
export function animateValue(el, targetValue, duration = 400, formatFn = (v) => fmt.format(v)) {
  if (!el) return;
  const endNum = typeof targetValue === "number" ? targetValue : (parseFloat(targetValue) || 0);
  const startNum = parseFloat(el.dataset.val) || 0;
  el.dataset.val = endNum;

  if (Math.abs(endNum - startNum) < 0.01) {
    el.innerText = formatFn(endNum);
    return;
  }

  el.classList.remove("value-pulse");
  void el.offsetWidth;
  el.classList.add("value-pulse");

  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease Out Quart
    const ease = 1 - Math.pow(1 - progress, 4);
    const current = startNum + (endNum - startNum) * ease;
    el.innerText = formatFn(current);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.innerText = formatFn(endNum);
    }
  }
  requestAnimationFrame(update);
}

export const fmtCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const fmtPct = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

/**
 * Robust numeric parser that handles string currency symbols, commas, and whitespace
 */
export function parseNum(val) {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const parsed = parseFloat(val.toString().replace(/[^0-9.-]+/g, ""));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Strict HTML escaping to prevent XSS injection via user-supplied text
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
  try {
    return btoa(encodeURIComponent(JSON.stringify(data)));
  } catch (err) {
    console.error("Failed to generate sync code:", err);
    return "";
  }
}

export function parseSyncCode(code) {
  if (!code || typeof code !== "string") return null;
  try {
    const jsonStr = decodeURIComponent(atob(code.trim()));
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Failed to decode sync code:", err);
    return null;
  }
}
