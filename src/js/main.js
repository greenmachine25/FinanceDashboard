/**
 * Main Application Bootstrap & Orchestration Module
 */

import {
  loadSavedState,
  getState,
  setState,
  updateState,
  subscribe,
  registerCloudSync,
} from "./state.js";
import {
  getRandomColor,
  exportDataAsJSON,
  exportDataAsSyncCode,
  parseSyncCode,
  refreshIcons,
  fmt,
} from "./utils.js";
import {
  calcAmortizationSchedule,
  calcLoanSweetSpot,
  calcInvestment30YearSeries,
} from "./calculations.js";
import {
  renderSweetSpotChart,
  renderApyChart,
  renderCompareChart,
} from "./charts.js";
import { initFirebase } from "./firebase.js";
import { showToast } from "./ui/toast.js";
import { openModal, closeModal, initModalListeners } from "./ui/modals.js";
import { switchTab, initSwipeNavigation } from "./ui/tabs.js";
import { renderOverview, updateOverviewDOM } from "./ui/renderOverview.js";
import { renderBudgets } from "./ui/renderBudgets.js";
import { renderGoals } from "./ui/renderGoals.js";
import { renderRents } from "./ui/renderRents.js";
import { renderLoans } from "./ui/renderLoans.js";
import { renderInvestments } from "./ui/renderInvestments.js";

// DOM Containers
let overviewContainer, dashboardsContainer, goalsContainer, rentsContainer, loansContainer, interestContainer;

let firebaseControls = null;
let currentSweetSpotMode = "monthly";
let currentCompareType = "loan";

/**
 * Apply Theme (Dark/Light)
 */
function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  const moonIcon = document.getElementById("moonIcon");
  const sunIcon = document.getElementById("sunIcon");
  if (moonIcon && sunIcon) {
    moonIcon.style.display = isDark ? "none" : "block";
    sunIcon.style.display = isDark ? "block" : "none";
  }
}

/**
 * Global Render Dispatcher
 */
function renderAll(state) {
  if (!overviewContainer) {
    overviewContainer = document.getElementById("overviewContainer");
    dashboardsContainer = document.getElementById("dashboardsContainer");
    goalsContainer = document.getElementById("goalsContainer");
    rentsContainer = document.getElementById("rentsContainer");
    loansContainer = document.getElementById("loansContainer");
    interestContainer = document.getElementById("interestContainer");
  }

  const fastUpdateHandler = () => updateOverviewDOM(getState());

  // Refresh Overview
  renderOverview(overviewContainer, state, (prop, val) => {
    updateState((s) => {
      s.masterPlan[prop] = val ? parseInt(val) : "";
      return s;
    }, "overview");
  });

  // Render Budgets
  renderBudgets(dashboardsContainer, state, {
    onUpdateLinkedItem: (id, prop, val) => {
      updateState((s) => {
        const item = s.dashboards.find((d) => d.id === id);
        if (item) item[prop] = val ? parseInt(val) : null;
        return s;
      }, "dashboard");
    },
    onToggleMinimize: (type, id) => toggleMinimize(type, id),
    onUpdateColor: (type, id, color) => updateColor(type, id, color),
    onDuplicate: (id) => duplicateItem("dashboard", id),
    onDelete: (id) => deleteItem("dashboard", id),
    onAddExpense: (dashId) => {
      updateState((s) => {
        const d = s.dashboards.find((x) => x.id === dashId);
        if (d) d.expenses.push({ id: Date.now(), name: "", amount: "", freq: "monthly" });
        return s;
      }, "dashboard");
    },
    onDeleteExpense: (dashId, expId) => {
      updateState((s) => {
        const d = s.dashboards.find((x) => x.id === dashId);
        if (d) d.expenses = d.expenses.filter((e) => e.id !== expId);
        return s;
      }, "dashboard");
    },
    onAddEarning: (dashId) => {
      updateState((s) => {
        const d = s.dashboards.find((x) => x.id === dashId);
        if (d) d.earnings.push({ id: Date.now(), name: "", amount: "", freq: "monthly" });
        return s;
      }, "dashboard");
    },
    onDeleteEarning: (dashId, earnId) => {
      updateState((s) => {
        const d = s.dashboards.find((x) => x.id === dashId);
        if (d) d.earnings = d.earnings.filter((e) => e.id !== earnId);
        return s;
      }, "dashboard");
    },
    onFastUpdate: fastUpdateHandler,
  });

  // Render Goals
  renderGoals(goalsContainer, state, {
    onUpdateProp: (id, prop, val) => {
      updateState((s) => {
        const item = s.goals.find((g) => g.id === id);
        if (item) item[prop] = val;
        return s;
      }, "goal");
    },
    onToggleMinimize: (type, id) => toggleMinimize(type, id),
    onUpdateColor: (type, id, color) => updateColor(type, id, color),
    onDuplicate: (id) => duplicateItem("goal", id),
    onDelete: (id) => deleteItem("goal", id),
    onFastUpdate: fastUpdateHandler,
  });

  // Render Rents
  renderRents(rentsContainer, state, {
    onToggleMinimize: (type, id) => toggleMinimize(type, id),
    onUpdateColor: (type, id, color) => updateColor(type, id, color),
    onDuplicate: (id) => duplicateItem("rent", id),
    onDelete: (id) => deleteItem("rent", id),
    onFastUpdate: fastUpdateHandler,
  });

  // Render Loans
  renderLoans(loansContainer, state, {
    onToggleMinimize: (type, id) => toggleMinimize(type, id),
    onUpdateColor: (type, id, color) => updateColor(type, id, color),
    onDuplicate: (id) => duplicateItem("loan", id),
    onDelete: (id) => deleteItem("loan", id),
    onShowAmortization: (id) => showAmortizationModal(id),
    onShowSweetSpot: (id) => showSweetSpotModal(id),
    onOptimizeAccelerator: (id, mode) => applyOptimalAccelerator(id, mode),
    onFastUpdate: fastUpdateHandler,
  });

  // Render Investments
  renderInvestments(interestContainer, state, {
    onToggleMinimize: (type, id) => toggleMinimize(type, id),
    onUpdateColor: (type, id, color) => updateColor(type, id, color),
    onDuplicate: (id) => duplicateItem("interest", id),
    onDelete: (id) => deleteItem("interest", id),
    onShowApyChart: (id) => showApyChartModal(id),
    onFastUpdate: fastUpdateHandler,
  });
}

function toggleMinimize(type, id) {
  updateState((s) => {
    let list = [];
    if (type === "dashboard") list = s.dashboards;
    else if (type === "loan") list = s.loans;
    else if (type === "rent") list = s.rents;
    else if (type === "goal") list = s.goals;
    else if (type === "interest") list = s.investments;

    const item = list.find((x) => x.id === id);
    if (item) item.isMinimized = !item.isMinimized;
    return s;
  }, type);
}

function updateColor(type, id, color) {
  updateState((s) => {
    let list = [];
    if (type === "dashboard") list = s.dashboards;
    else if (type === "loan") list = s.loans;
    else if (type === "rent") list = s.rents;
    else if (type === "goal") list = s.goals;
    else if (type === "interest") list = s.investments;

    const item = list.find((x) => x.id === id);
    if (item) item.color = color;
    return s;
  }, type);
}

function duplicateItem(type, id) {
  updateState((s) => {
    let list = [];
    if (type === "dashboard") list = s.dashboards;
    else if (type === "loan") list = s.loans;
    else if (type === "rent") list = s.rents;
    else if (type === "goal") list = s.goals;
    else if (type === "interest") list = s.investments;

    const item = list.find((x) => x.id === id);
    if (item) {
      const copy = JSON.parse(JSON.stringify(item));
      copy.id = Date.now();
      copy.name = `${copy.name} (Copy)`;
      copy.color = getRandomColor(item.color);
      list.unshift(copy);
      showToast("Scenario duplicated!");
    }
    return s;
  }, type);
}

function deleteItem(type, id) {
  updateState((s) => {
    if (type === "dashboard") {
      s.dashboards = s.dashboards.filter((d) => d.id !== id);
      if (s.masterPlan.budgetId == id) s.masterPlan.budgetId = "";
    } else if (type === "loan") {
      s.loans = s.loans.filter((l) => l.id !== id);
      if (s.masterPlan.loanId == id) s.masterPlan.loanId = "";
      s.dashboards.forEach((d) => {
        if (d.linkedLoanId === id) d.linkedLoanId = null;
      });
    } else if (type === "rent") {
      s.rents = s.rents.filter((r) => r.id !== id);
      if (s.masterPlan.rentId == id) s.masterPlan.rentId = "";
      s.dashboards.forEach((d) => {
        if (d.linkedRentId === id) d.linkedRentId = null;
      });
    } else if (type === "goal") {
      s.goals = s.goals.filter((g) => g.id !== id);
    } else if (type === "interest") {
      s.investments = s.investments.filter((i) => i.id !== id);
      if (s.masterPlan.invId == id) s.masterPlan.invId = "";
      s.dashboards.forEach((d) => {
        if (d.linkedInvestmentId === id) d.linkedInvestmentId = null;
      });
    }
    showToast("Scenario deleted.");
    return s;
  }, type);
}

/**
 * Modal Chart Triggers
 */
function showAmortizationModal(loanId) {
  const state = getState();
  const loan = state.loans.find((l) => l.id === loanId);
  if (!loan) return;

  const schedule = calcAmortizationSchedule(loan);
  const tbody = document.getElementById("amortTableBody");
  if (!tbody) return;

  if (schedule.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">Please enter valid loan balance, rate, and term to view amortization schedule.</td></tr>`;
  } else {
    tbody.innerHTML = schedule
      .map(
        (row) => `
      <tr>
        <td style="font-weight: 700;">#${row.month}</td>
        <td class="font-mono font-bold">${fmt.format(row.payment)}</td>
        <td class="font-mono font-bold" style="color: var(--brand-rose);">${fmt.format(row.interest)}</td>
        <td class="font-mono font-bold" style="color: var(--brand-teal);">${fmt.format(row.principal)}</td>
        <td class="font-mono" style="text-align: right; font-weight: 600;">${fmt.format(row.balance)}</td>
      </tr>
    `
      )
      .join("");
  }

  openModal("amortModal");
}

function showSweetSpotModal(loanId) {
  const state = getState();
  const loan = state.loans.find((l) => l.id === loanId);
  if (!loan) return;

  state.sweetSpotId = loanId;
  const sweetSpotData = calcLoanSweetSpot(loan, currentSweetSpotMode);
  if (!sweetSpotData) {
    return showToast("Please enter valid loan details first.", true);
  }

  // Update Sweet Spot Result Banner
  const banner = document.getElementById("sweetSpotResult");
  const payEl = document.getElementById("ss-payment");
  const intEl = document.getElementById("ss-interest");
  const timeEl = document.getElementById("ss-time");

  if (banner && payEl && intEl && timeEl) {
    payEl.innerText = sweetSpotData.optimalLabel;
    intEl.innerText = fmt.format(sweetSpotData.optimalInterest);
    timeEl.innerText = `${sweetSpotData.optimalTime} yrs`;
    banner.classList.remove("hidden");
  }

  openModal("chartModal");

  const canvas = document.getElementById("sweetSpotCanvas");
  const isDark = document.documentElement.classList.contains("dark");
  const hasLumpSum = (parseFloat(loan.lumpSum) || 0) > 0;
  renderSweetSpotChart(canvas, sweetSpotData, isDark, hasLumpSum, currentSweetSpotMode);
}

function applyOptimalAccelerator(loanId, mode) {
  const state = getState();
  const loan = state.loans.find((l) => l.id === loanId);
  if (!loan) return;

  const sweetSpotData = calcLoanSweetSpot(loan, mode);
  if (!sweetSpotData) {
    return showToast("Please enter valid loan details first.", true);
  }

  updateState((s) => {
    const l = s.loans.find((x) => x.id === loanId);
    if (l) {
      if (mode === "monthly") l.extra = sweetSpotData.optimalValue.toString();
      else l.lumpSum = sweetSpotData.optimalValue.toString();
    }
    return s;
  }, "loan");

  showToast("Optimal value applied to accelerator!", false, "sparkles");
}

function showApyChartModal(invId) {
  const state = getState();
  const inv = state.investments.find((i) => i.id === invId);
  if (!inv) return;

  const series = calcInvestment30YearSeries(inv);

  document.getElementById("apy-stat-prin").innerText = fmt.format(series.finalPrincipal);
  document.getElementById("apy-stat-int").innerText = fmt.format(series.finalInterest);
  document.getElementById("apy-stat-bal").innerText = fmt.format(series.finalBalance);

  openModal("apyChartModal");

  const canvas = document.getElementById("apySweetSpotCanvas");
  const isDark = document.documentElement.classList.contains("dark");
  renderApyChart(canvas, series, isDark);
}

function showCompareModal(type, chartType = null) {
  currentCompareType = type;
  const state = getState();
  state.lastCompareCategory = type;

  const select = document.getElementById("compareTypeToggle");
  const chosenChartType = chartType || (select ? select.value : "bar");

  const titleEl = document.getElementById("compareModalTitle");
  if (titleEl) {
    const titles = {
      loan: "Loan Scenarios (Interest vs Time)",
      interest: "APY Savings Growth (10 Years)",
      dashboard: "Budget Cash Flow (Monthly)",
      rent: "Rent & Utilities Obligations",
    };
    titleEl.innerHTML = `<i data-lucide="bar-chart-2" style="width: 1.5rem; height: 1.5rem; margin-right: 0.5rem;"></i> ${titles[type] || "Scenario Comparison"}`;
  }

  openModal("compareModal");

  const canvas = document.getElementById("compareCanvas");
  const isDark = document.documentElement.classList.contains("dark");
  renderCompareChart(canvas, type, chosenChartType, state, isDark);
  refreshIcons();
}

/**
 * Attach Top-Level Event Handlers
 */
function initGlobalListeners() {
  // Theme Toggle
  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.onclick = () => {
      const state = getState();
      const nextTheme = state.theme === "light" ? "dark" : "light";
      applyTheme(nextTheme);
      updateState((s) => {
        s.theme = nextTheme;
        return s;
      });
    };
  }

  // Desktop & Mobile Tab Switching
  document.querySelectorAll(".nav-tab-btn, .mobile-nav-item").forEach((btn) => {
    btn.onclick = () => {
      const tabId = btn.dataset.tab;
      if (tabId) switchTab(tabId);
    };
  });

  // New Scenario Buttons
  document.getElementById("addDashboardBtn")?.addEventListener("click", () => {
    updateState((s) => {
      s.dashboards.unshift({
        id: Date.now(),
        name: `Budget Scenario ${s.dashboards.length + 1}`,
        income: "0",
        expenses: [],
        earnings: [],
        color: getRandomColor(),
        isMinimized: false,
      });
      return s;
    }, "dashboard");
    showToast("New Budget Scenario created!");
  });

  document.getElementById("addGoalBtn")?.addEventListener("click", () => {
    updateState((s) => {
      s.goals.unshift({
        id: Date.now(),
        name: `New Goal ${s.goals.length + 1}`,
        targetAmount: "",
        savedAmount: "",
        monthlyContrib: "",
        linkedDashboardId: "",
        color: getRandomColor(),
        isMinimized: false,
      });
      return s;
    }, "goal");
    showToast("New Goal created!");
  });

  document.getElementById("addRentBtn")?.addEventListener("click", () => {
    updateState((s) => {
      s.rents.unshift({
        id: Date.now(),
        name: `Rent Option ${s.rents.length + 1}`,
        baseRent: "",
        water: "",
        electricity: "",
        internet: "",
        other: "",
        color: getRandomColor(),
        isMinimized: false,
      });
      return s;
    }, "rent");
    showToast("New Rent Scenario created!");
  });

  document.getElementById("addLoanBtn")?.addEventListener("click", () => {
    updateState((s) => {
      s.loans.unshift({
        id: Date.now(),
        name: `Loan Option ${s.loans.length + 1}`,
        origAmount: "",
        amount: "",
        rate: "",
        years: "",
        minPaymentOverride: "",
        extra: "",
        lumpSum: "",
        color: getRandomColor(),
        isMinimized: false,
      });
      return s;
    }, "loan");
    showToast("New Loan Scenario created!");
  });

  document.getElementById("addInvestmentBtn")?.addEventListener("click", () => {
    updateState((s) => {
      s.investments.unshift({
        id: Date.now(),
        name: `Bank APY ${s.investments.length + 1}`,
        principal: "",
        monthly: "",
        rate: "",
        taxBracket: "",
        rateCap: "",
        rateOverCap: "",
        color: getRandomColor(),
        isMinimized: false,
      });
      return s;
    }, "interest");
    showToast("New APY Scenario created!");
  });

  // Compare Buttons
  document.getElementById("compareDashboardBtn")?.addEventListener("click", () => showCompareModal("dashboard"));
  document.getElementById("compareRentBtn")?.addEventListener("click", () => showCompareModal("rent"));
  document.getElementById("compareLoanBtn")?.addEventListener("click", () => showCompareModal("loan"));
  document.getElementById("compareInterestBtn")?.addEventListener("click", () => showCompareModal("interest"));

  // Compare Chart Type Toggle
  document.getElementById("compareTypeToggle")?.addEventListener("change", (e) => {
    showCompareModal(currentCompareType, e.target.value);
  });

  // Sweet Spot Mode Toggle
  document.getElementById("ssModeToggle")?.addEventListener("change", (e) => {
    currentSweetSpotMode = e.target.value;
    const state = getState();
    if (state.sweetSpotId) showSweetSpotModal(state.sweetSpotId);
  });

  // Settings & Sync Modal
  document.getElementById("settingsBtn")?.addEventListener("click", () => openModal("settingsModal"));

  document.getElementById("exportFileBtn")?.addEventListener("click", () => {
    exportDataAsJSON(getState());
    showToast("Backup exported successfully!");
  });

  document.getElementById("importFileInput")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed && (parsed.dashboards || parsed.loans || parsed.rents)) {
          setState(parsed);
          closeModal("settingsModal");
          showToast("Data imported successfully!");
        } else {
          showToast("Invalid backup file format.", true);
        }
      } catch (err) {
        showToast("Failed to parse JSON file.", true);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  document.getElementById("exportCodeBtn")?.addEventListener("click", () => {
    try {
      const code = exportDataAsSyncCode(getState());
      navigator.clipboard.writeText(code).then(() => {
        showToast("Sync Code copied to clipboard!");
      });
    } catch (err) {
      showToast("Failed to generate sync code.", true);
    }
  });

  document.getElementById("importCodeBtn")?.addEventListener("click", () => {
    const input = document.getElementById("importCodeInput");
    if (!input || !input.value.trim()) return;
    const parsed = parseSyncCode(input.value);
    if (parsed) {
      setState(parsed);
      input.value = "";
      closeModal("settingsModal");
      showToast("Sync code loaded successfully!");
    } else {
      showToast("Invalid or corrupted Sync Code.", true);
    }
  });

  // Modal Close Buttons
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const modalId = e.currentTarget.dataset.closeModal;
      if (modalId) closeModal(modalId);
    });
  });

  // Dismiss dropdowns on outside click
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".color-picker-dropdown")) {
      document.querySelectorAll(".color-palette-menu").forEach((m) => m.classList.add("hidden"));
    }
  });

  // Mobile Keyboard Floating Done Button
  const mobileDoneBtn = document.getElementById("mobileDoneBtn");
  if (mobileDoneBtn) {
    document.addEventListener("focusin", (e) => {
      if (window.innerWidth < 960 && e.target.tagName === "INPUT") {
        mobileDoneBtn.classList.add("visible");
      }
    });

    document.addEventListener("focusout", () => {
      setTimeout(() => {
        if (document.activeElement?.tagName !== "INPUT") {
          mobileDoneBtn.classList.remove("visible");
        }
      }, 100);
    });

    mobileDoneBtn.onclick = () => {
      if (document.activeElement) document.activeElement.blur();
    };
  }

  // Mobile Swipe Gesture Container
  initSwipeNavigation(document.getElementById("mainContainer"), (tabId) => {});
}

/**
 * Application Bootstrap
 */
async function bootstrap() {
  initModalListeners();
  initGlobalListeners();

  const state = loadSavedState();
  applyTheme(state.theme);
  renderAll(state);

  // Subscribe to state updates
  subscribe((newState, options) => {
    if (options && options.reRender === false) {
      updateOverviewDOM(newState);
      return;
    }
    renderAll(newState);
  });

  // Initialize Firebase Cloud Sync
  firebaseControls = await initFirebase(
    (cloudData) => {
      if (cloudData) {
        setState(cloudData);
      }
      return getState();
    },
    (user) => {
      const authBtn = document.getElementById("authBtn");
      if (!authBtn) return;
      if (user) {
        authBtn.innerHTML = `<img src="${user.photoURL || ""}" style="width: 1.6rem; height: 1.6rem; border-radius: var(--radius-full); border: 2px solid var(--brand-teal);" title="Logged in as ${user.email}">`;
        authBtn.onclick = () => openModal("logoutModal");
      } else {
        authBtn.innerHTML = `<i data-lucide="user" style="width: 1.25rem; height: 1.25rem;"></i>`;
        authBtn.onclick = () => {
          if (firebaseControls?.login) firebaseControls.login();
          else showToast("Firebase offline / not loaded", true);
        };
        refreshIcons();
      }
    },
    showToast
  );

  if (firebaseControls) {
    registerCloudSync((data) => firebaseControls.saveToCloud(data));
    document.getElementById("confirmLogoutBtn")?.addEventListener("click", () => {
      firebaseControls.logout();
      closeModal("logoutModal");
    });
  }

  // Register PWA Service Worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("sw.js")
        .catch((err) => console.warn("Service Worker registration failed:", err));
    });
  }

  refreshIcons();
}

document.addEventListener("DOMContentLoaded", bootstrap);
