/**
 * Central State Store & Persistence Management for FinanceHub
 */

import { getRandomColor, debounce } from "./utils.js";

const STORAGE_KEY = "financeHubData";

export const defaultState = {
  theme: "light",
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

function notifySubscribers(changedCategory = null) {
  subscribers.forEach((fn) => {
    try {
      fn(state, changedCategory);
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
}, 800);

export function setState(newState, changedCategory = null) {
  state = migrateState(newState);
  debouncedSave();
  notifySubscribers(changedCategory);
}

export function updateState(updaterFn, changedCategory = null) {
  const updated = updaterFn(state);
  if (updated) {
    state = migrateState(updated);
  }
  debouncedSave();
  notifySubscribers(changedCategory);
}

/**
 * Migration & backward compatibility normalizer
 */
export function migrateState(raw) {
  if (!raw || typeof raw !== "object") return createInitialState();

  const clean = {
    theme: raw.theme || "light",
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

  // Ensure individual items have all expected properties
  clean.dashboards.forEach((d) => {
    if (!Array.isArray(d.expenses)) d.expenses = [];
    if (!Array.isArray(d.earnings)) d.earnings = [];
    if (!d.color) d.color = getRandomColor();
    if (d.isMinimized === undefined) d.isMinimized = false;
  });

  clean.rents.forEach((r) => {
    if (!r.color) r.color = getRandomColor();
    if (r.isMinimized === undefined) r.isMinimized = false;
  });

  clean.loans.forEach((l) => {
    if (!l.color) l.color = getRandomColor();
    if (l.lumpSum === undefined) l.lumpSum = "";
    if (l.isMinimized === undefined) l.isMinimized = false;
  });

  clean.investments.forEach((i) => {
    if (!i.color) i.color = getRandomColor();
    if (i.rateCap === undefined) i.rateCap = "";
    if (i.rateOverCap === undefined) i.rateOverCap = "";
    if (i.isMinimized === undefined) i.isMinimized = false;
  });

  clean.goals.forEach((g) => {
    if (!g.color) g.color = getRandomColor();
    if (g.isMinimized === undefined) g.isMinimized = false;
  });

  return clean;
}

export function createInitialState() {
  const now = Date.now();
  return {
    theme: "light",
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
        income: "1200",
        expenses: [
          { id: now + 10, name: "Groceries", amount: "400", freq: "monthly" },
          { id: now + 11, name: "Subscriptions", amount: "50", freq: "monthly" },
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
        name: "Apartment Downtown",
        baseRent: "1400",
        water: "40",
        electricity: "85",
        internet: "60",
        other: "25",
        color: "bg-cyan-500",
        isMinimized: false,
      },
    ],
    loans: [
      {
        id: now + 2,
        name: "Auto Loan",
        origAmount: "25000",
        amount: "18500",
        rate: "4.5",
        years: "5",
        minPaymentOverride: "",
        extra: "100",
        lumpSum: "",
        color: "bg-blue-500",
        isMinimized: false,
      },
    ],
    investments: [
      {
        id: now + 3,
        name: "High-Yield Savings",
        principal: "5000",
        monthly: "250",
        rate: "4.75",
        taxBracket: "22",
        rateCap: "",
        rateOverCap: "",
        color: "bg-indigo-500",
        isMinimized: false,
      },
    ],
    goals: [
      {
        id: now + 4,
        name: "Emergency Reserve",
        targetAmount: "10000",
        savedAmount: "3500",
        monthlyContrib: "200",
        linkedDashboardId: now,
        color: "bg-fuchsia-500",
        isMinimized: false,
      },
    ],
    sweetSpotId: null,
    lastCompareCategory: null,
  };
}

export function loadSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state = migrateState(parsed);
    } else {
      state = createInitialState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (err) {
    console.error("Error reading saved state:", err);
    state = createInitialState();
  }
  return state;
}
