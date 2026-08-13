/**
 * Master Overview Tab Renderer
 */

import { fmt, refreshIcons } from "../utils.js";
import { calcOverviewMetrics, calcBudgetMetrics } from "../calculations.js";

export function renderOverview(container, state, onMasterPlanChange) {
  if (!container || !state) return;

  const mp = state.masterPlan || { budgetId: "", rentId: "", loanId: "", invId: "" };
  const overviewMetrics = calcOverviewMetrics(state);
  const activeBudget = state.dashboards.find((d) => d.id == mp.budgetId) || null;
  const budgetMetrics = activeBudget ? calcBudgetMetrics(activeBudget, state) : null;

  container.innerHTML = `
    <!-- Scenario Selectors -->
    <div class="cards-grid cards-grid-4 mb-6" style="margin-bottom: 2rem;">
      <div class="glass-card" style="padding: 1.25rem;">
        <label class="input-label text-brand-teal" style="color: var(--brand-teal); margin-bottom: 0.5rem;">
          <i data-lucide="layout-dashboard" style="width: 0.9rem; height: 0.9rem;"></i> Primary Budget
        </label>
        <select id="mp-select-budget" class="select-field">
          <option value="">-- Select Scenario --</option>
          ${state.dashboards
            .map((d) => `<option value="${d.id}" ${mp.budgetId == d.id ? "selected" : ""}>${d.name}</option>`)
            .join("")}
        </select>
      </div>

      <div class="glass-card" style="padding: 1.25rem;">
        <label class="input-label text-brand-emerald" style="color: var(--brand-emerald); margin-bottom: 0.5rem;">
          <i data-lucide="home" style="width: 0.9rem; height: 0.9rem;"></i> Primary Rent
        </label>
        <select id="mp-select-rent" class="select-field">
          <option value="">-- Select Scenario --</option>
          ${state.rents
            .map((r) => `<option value="${r.id}" ${mp.rentId == r.id ? "selected" : ""}>${r.name}</option>`)
            .join("")}
        </select>
      </div>

      <div class="glass-card" style="padding: 1.25rem;">
        <label class="input-label text-brand-rose" style="color: var(--brand-rose); margin-bottom: 0.5rem;">
          <i data-lucide="landmark" style="width: 0.9rem; height: 0.9rem;"></i> Focus Loan
        </label>
        <select id="mp-select-loan" class="select-field">
          <option value="">-- Select Scenario --</option>
          ${state.loans
            .map((l) => `<option value="${l.id}" ${mp.loanId == l.id ? "selected" : ""}>${l.name}</option>`)
            .join("")}
        </select>
      </div>

      <div class="glass-card" style="padding: 1.25rem;">
        <label class="input-label text-brand-blue" style="color: var(--brand-blue); margin-bottom: 0.5rem;">
          <i data-lucide="trending-up" style="width: 0.9rem; height: 0.9rem;"></i> Focus APY
        </label>
        <select id="mp-select-inv" class="select-field">
          <option value="">-- Select Scenario --</option>
          ${state.investments
            .map((i) => `<option value="${i.id}" ${mp.invId == i.id ? "selected" : ""}>${i.name}</option>`)
            .join("")}
        </select>
      </div>
    </div>

    <!-- Hero Section: Net Worth -->
    <div class="net-worth-hero gradient-bg">
      <div>
        <p class="net-worth-label tooltip-help" title="Calculated from ALL your scenario starting balances (Investments + Goals - Loans).">
          Total Starting Net Worth
        </p>
        <h1 class="net-worth-amount ${!overviewMetrics.isPositiveNetWorth ? "text-rose-200" : ""}">
          ${fmt.format(overviewMetrics.netWorth)}
        </h1>
      </div>
      <div class="net-worth-stats">
        <div class="net-worth-stat-box">
          <p class="net-worth-stat-label">Total Assets</p>
          <p class="net-worth-stat-value font-mono">${fmt.format(overviewMetrics.totalAssets)}</p>
        </div>
        <div class="net-worth-stat-box dark-box">
          <p class="net-worth-stat-label">Total Debt</p>
          <p class="net-worth-stat-value font-mono" style="color: #fca5a5;">${fmt.format(overviewMetrics.totalDebt)}</p>
        </div>
      </div>
    </div>

    <!-- Snapshot Row -->
    ${
      activeBudget && budgetMetrics
        ? `
      <div class="cards-grid cards-grid-3">
        <div class="glass-card" style="padding: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 class="metric-label">Mo. Cash In</h3>
            <div style="padding: 0.5rem; background: rgba(16, 185, 129, 0.15); border-radius: var(--radius-lg); color: var(--brand-emerald);">
              <i data-lucide="arrow-down-to-line" style="width: 1.25rem; height: 1.25rem;"></i>
            </div>
          </div>
          <p class="metric-value font-mono" style="color: var(--brand-emerald);">${fmt.format(budgetMetrics.monthlyInc)}</p>
          <p style="font-size: 0.775rem; color: var(--text-muted); margin-top: 0.5rem;">From primary budget income</p>
        </div>

        <div class="glass-card" style="padding: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 class="metric-label">Mo. Cash Out</h3>
            <div style="padding: 0.5rem; background: rgba(244, 63, 94, 0.15); border-radius: var(--radius-lg); color: var(--brand-rose);">
              <i data-lucide="arrow-up-from-line" style="width: 1.25rem; height: 1.25rem;"></i>
            </div>
          </div>
          <p class="metric-value font-mono" style="color: var(--brand-rose);">${fmt.format(budgetMetrics.monthlyExp)}</p>
          <p style="font-size: 0.775rem; color: var(--text-muted); margin-top: 0.5rem;">Expenses, goals, & linked payments</p>
        </div>

        <div class="glass-card" style="padding: 1.5rem; border-bottom: 4px solid var(--brand-teal);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 class="metric-label" style="color: var(--brand-teal);">Mo. Net Wiggle Room</h3>
            <div style="padding: 0.5rem; background: rgba(14, 165, 233, 0.15); border-radius: var(--radius-lg); color: var(--brand-teal);">
              <i data-lucide="wallet" style="width: 1.25rem; height: 1.25rem;"></i>
            </div>
          </div>
          <p class="metric-value font-mono" style="color: var(--brand-teal);">${fmt.format(budgetMetrics.netMonthly)}</p>
          <p style="font-size: 0.775rem; color: var(--text-muted); margin-top: 0.5rem;">Disposable cash after everything</p>
        </div>
      </div>
    `
        : `
      <div class="glass-card" style="padding: 3rem; text-align: center; border: 2px dashed var(--border-subtle);">
        <i data-lucide="mouse-pointer-click" style="width: 2.5rem; height: 2.5rem; margin: 0 auto 1rem; color: var(--text-subtle);"></i>
        <p style="font-size: 1.1rem; font-weight: 700; color: var(--text-muted);">
          Select a Primary Budget above to view your Monthly Cash Flow Snapshot.
        </p>
      </div>
    `
    }
  `;

  // Attach master plan select listeners
  const bSel = container.querySelector("#mp-select-budget");
  const rSel = container.querySelector("#mp-select-rent");
  const lSel = container.querySelector("#mp-select-loan");
  const iSel = container.querySelector("#mp-select-inv");

  if (bSel) bSel.onchange = (e) => onMasterPlanChange("budgetId", e.target.value);
  if (rSel) rSel.onchange = (e) => onMasterPlanChange("rentId", e.target.value);
  if (lSel) lSel.onchange = (e) => onMasterPlanChange("loanId", e.target.value);
  if (iSel) iSel.onchange = (e) => onMasterPlanChange("invId", e.target.value);

  refreshIcons();
}
