/**
 * Central State Store & Persistence Management for FinanceHub
 */

import { getRandomColor, debounce } from "./utils.js";

const STORAGE_KEY = "financeHubData";

export const defaultState = {
  theme: "dark",
  masterPlan: {
    budgetId: "",
    rentId: "",
    loanId: "",
    invId: "",
  },
  dashboards: [],
  rents: [],
  loans: [],
  investments: [],
  goals: [],
  sweetSpotId: null,
  lastCompareCategory: null,
};

let state = { ...defaultState };
const subscribers = new Set();
let cloudSyncCallback = null;

export function registerCloudSync(callback) {
  cloudSyncCallback = callback;
}

export function getState() {
  return state;
}

export function subscribe(listener) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

function notifySubscribers(options = { reRender: true, category: null }) {
  subscribers.forEach((fn) => {
    try {
      fn(state, options);
    } catch (err) {
      console.error("Subscriber notification error:", err);
    }
  });
}

const debouncedSave = debounce(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (typeof cloudSyncCallback === "function") {
      cloudSyncCallback(state);
    }
  } catch (err) {
    console.error("Failed to save state to localStorage:", err);
  }
}, 600);

export function setState(newState, options = { reRender: true, category: null }) {
  state = migrateState(newState);
  debouncedSave();
  notifySubscribers(typeof options === "string" ? { reRender: true, category: options } : options);
}

export function updateState(updaterFn, options = { reRender: true, category: null }) {
  const updated = updaterFn(state);
  if (updated && options.reRender) {
    state = migrateState(updated);
  }
  debouncedSave();
  notifySubscribers(typeof options === "string" ? { reRender: true, category: options } : options);
}

export function updateStateSilently(updaterFn) {
  updaterFn(state);
  debouncedSave();
}

/**
 * Migration & backward compatibility normalizer with schema sanitization
 */
export function migrateState(raw) {
  if (!raw || typeof raw !== "object") return createInitialState();

  const clean = {
    theme: raw.theme === "light" ? "light" : "dark",
    masterPlan: {
      budgetId: raw.masterPlan?.budgetId ?? "",
      rentId: raw.masterPlan?.rentId ?? "",
      loanId: raw.masterPlan?.loanId ?? "",
      invId: raw.masterPlan?.invId ?? "",
    },
    dashboards: Array.isArray(raw.dashboards) ? raw.dashboards : [],
    rents: Array.isArray(raw.rents) ? raw.rents : [],
    loans: Array.isArray(raw.loans) ? raw.loans : [],
    investments: Array.isArray(raw.investments) ? raw.investments : [],
    goals: Array.isArray(raw.goals) ? raw.goals : [],
    sweetSpotId: raw.sweetSpotId || null,
    lastCompareCategory: raw.lastCompareCategory || null,
  };

  // Ensure individual items have all expected properties sanitized
  clean.dashboards = clean.dashboards.map((d) => ({
    id: d.id || Date.now() + Math.floor(Math.random() * 1000),
    name: String(d.name || "Budget Scenario"),
    income: String(d.income || "0"),
    expenses: Array.isArray(d.expenses)
      ? d.expenses.map((e) => ({
          id: e.id || Date.now() + Math.floor(Math.random() * 1000),
          name: String(e.name || ""),
          amount: String(e.amount || "0"),
          freq: ["weekly", "monthly", "yearly"].includes(e.freq) ? e.freq : "monthly",
        }))
      : [],
    earnings: Array.isArray(d.earnings)
      ? d.earnings.map((e) => ({
          id: e.id || Date.now() + Math.floor(Math.random() * 1000),
          name: String(e.name || ""),
          amount: String(e.amount || "0"),
          freq: ["weekly", "monthly", "yearly"].includes(e.freq) ? e.freq : "monthly",
        }))
      : [],
    color: d.color || getRandomColor(),
    isMinimized: !!d.isMinimized,
    linkedRentId: d.linkedRentId ? Number(d.linkedRentId) : null,
    linkedLoanId: d.linkedLoanId ? Number(d.linkedLoanId) : null,
    linkedInvestmentId: d.linkedInvestmentId ? Number(d.linkedInvestmentId) : null,
  }));

  clean.rents = clean.rents.map((r) => ({
    id: r.id || Date.now() + Math.floor(Math.random() * 1000),
    name: String(r.name || "Apartment"),
    baseRent: String(r.baseRent || "0"),
    water: String(r.water || "0"),
    electricity: String(r.electricity || "0"),
    internet: String(r.internet || "0"),
    other: String(r.other || "0"),
    color: r.color || getRandomColor(),
    isMinimized: !!r.isMinimized,
  }));

  clean.loans = clean.loans.map((l) => ({
    id: l.id || Date.now() + Math.floor(Math.random() * 1000),
    name: String(l.name || "Loan"),
    origAmount: String(l.origAmount || "0"),
    amount: String(l.amount || "0"),
    rate: String(l.rate || "0"),
    years: String(l.years || "5"),
    minPaymentOverride: String(l.minPaymentOverride || ""),
    extra: String(l.extra || "0"),
    lumpSum: String(l.lumpSum || "0"),
    color: l.color || getRandomColor(),
    isMinimized: !!l.isMinimized,
  }));

  clean.investments = clean.investments.map((i) => ({
    id: i.id || Date.now() + Math.floor(Math.random() * 1000),
    name: String(i.name || "Savings Account"),
    principal: String(i.principal || "0"),
    monthly: String(i.monthly || "0"),
    rate: String(i.rate || "0"),
    taxBracket: String(i.taxBracket || "0"),
    rateCap: String(i.rateCap || ""),
    rateOverCap: String(i.rateOverCap || ""),
    color: i.color || getRandomColor(),
    isMinimized: !!i.isMinimized,
  }));

  clean.goals = clean.goals.map((g) => ({
    id: g.id || Date.now() + Math.floor(Math.random() * 1000),
    name: String(g.name || "Savings Goal"),
    targetAmount: String(g.targetAmount || "0"),
    savedAmount: String(g.savedAmount || "0"),
    monthlyContrib: String(g.monthlyContrib || "0"),
    linkedDashboardId: g.linkedDashboardId ? Number(g.linkedDashboardId) : null,
    color: g.color || getRandomColor(),
    isMinimized: !!g.isMinimized,
  }));

  if (clean.dashboards.length === 0 && clean.rents.length === 0 && clean.loans.length === 0) {
    return createInitialState();
  }

  return clean;
}

export function createInitialState() {
  const now = Date.now();
  return {
    theme: "dark",
    masterPlan: {
      budgetId: now,
      rentId: now + 1,
      loanId: now + 2,
      invId: now + 3,
    },
    dashboards: [
      {
        id: now,
        name: "Primary Budget",
        income: "1350",
        expenses: [
          { id: now + 10, name: "Groceries & Essentials", amount: "450", freq: "monthly" },
          { id: now + 11, name: "Subscriptions & Media", amount: "65", freq: "monthly" },
          { id: now + 12, name: "Transport & Fuel", amount: "180", freq: "monthly" },
        ],
        earnings: [],
        color: "bg-teal-500",
        isMinimized: false,
        linkedRentId: now + 1,
        linkedLoanId: now + 2,
        linkedInvestmentId: now + 3,
      },
    ],
    rents: [
      {
        id: now + 1,
        name: "Metro Apartment",
        baseRent: "1450",
        water: "45",
        electricity: "90",
        internet: "65",
        other: "30",
        color: "bg-cyan-500",
        isMinimized: false,
      },
    ],
    loans: [
      {
        id: now + 2,
        name: "Auto Loan",
        origAmount: "28000",
        amount: "19500",
        rate: "4.75",
        years: "5",
        minPaymentOverride: "",
        extra: "150",
        lumpSum: "",
        color: "bg-blue-500",
        isMinimized: false,
      },
    ],
    investments: [
      {
        id: now + 3,
        name: "High-Yield Savings (HYSA)",
        principal: "7500",
        monthly: "350",
        rate: "4.85",
        taxBracket: "22",
        rateCap: "25000",
        rateOverCap: "1.25",
        color: "bg-emerald-500",
        isMinimized: false,
      },
    ],
    goals: [
      {
        id: now + 4,
        name: "Emergency Fund (6 Mo)",
        targetAmount: "12000",
        savedAmount: "6500",
        monthlyContrib: "300",
        linkedDashboardId: now,
        color: "bg-fuchsia-500",
        isMinimized: false,
      },
    ],
    sweetSpotId: now + 2,
    lastCompareCategory: null,
  };
}

export function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = migrateState(parsed);
    } else {
      state = createInitialState();
    }
  } catch (err) {
    console.error("Failed to load state from localStorage:", err);
    state = createInitialState();
  }
  return state;
}
