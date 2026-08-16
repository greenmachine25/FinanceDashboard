/**
 * Master Overview Tab Renderer
 */

import { fmt, escapeHtml, refreshIcons } from "../utils.js";
import { calcOverviewMetrics, calcBudgetMetrics } from "../calculations.js";

export function updateOverviewDOM(state) {
  const container = document.getElementById("overviewContainer");
  if (!container || !state) return;

  const mp = state.masterPlan || { budgetId: "", rentId: "", loanId: "", invId: "" };
  const overviewMetrics = calcOverviewMetrics(state);
  const activeBudget = state.dashboards.find((d) => d.id == mp.budgetId) || null;
  const budgetMetrics = activeBudget ? calcBudgetMetrics(activeBudget, state) : null;

  const nwEl = container.querySelector(".overview-net-worth");
  const assetsEl = container.querySelector(".overview-total-assets");
  const debtEl = container.querySelector(".overview-total-debt");

  if (nwEl) nwEl.innerText = fmt.format(overviewMetrics.netWorth);
  if (assetsEl) assetsEl.innerText = fmt.format(overviewMetrics.totalAssets);
  if (debtEl) debtEl.innerText = fmt.format(overviewMetrics.totalDebt);

  if (budgetMetrics) {
    const inEl = container.querySelector(".overview-cash-in");
    const outEl = container.querySelector(".overview-cash-out");
    const wiggleEl = container.querySelector(".overview-wiggle");
    const srEl = container.querySelector(".overview-savings-rate");
    const srBarEl = container.querySelector(".overview-savings-bar");
    const r3El = container.querySelector(".overview-runway-3mo");
    const r6El = container.querySelector(".overview-runway-6mo");

    if (inEl) inEl.innerText = fmt.format(budgetMetrics.monthlyInc);
    if (outEl) outEl.innerText = fmt.format(budgetMetrics.monthlyExp);
    if (wiggleEl) wiggleEl.innerText = fmt.format(budgetMetrics.netMonthly);
    if (srEl) srEl.innerText = `${Math.round(budgetMetrics.savingsRate)}%`;
    if (srBarEl) srBarEl.style.width = `${budgetMetrics.savingsRate}%`;
    if (r3El) r3El.innerText = fmt.format(budgetMetrics.emergencyFund3Mo);
    if (r6El) r6El.innerText = fmt.format(budgetMetrics.emergencyFund6Mo);
  }
}

export function renderOverview(container, state, onMasterPlanChange) {
  if (!container || !state) return;

  const mp = state.masterPlan || { budgetId: "", rentId: "", loanId: "", invId: "" };
  const overviewMetrics = calcOverviewMetrics(state);
  const activeBudget = state.dashboards.find((d) => d.id == mp.budgetId) || null;
  const budgetMetrics = activeBudget ? calcBudgetMetrics(activeBudget, state) : null;

  container.innerHTML = `
    <!-- Scenario Selection Quick-Bar -->
    <div class="cards-grid cards-grid-4" style="margin-bottom: 1.75rem;">
      <div class="glass-card" style="padding: 1rem 1.15rem;">
        <label class="input-label" style="color: var(--brand-teal); margin-bottom: 0.4rem;">
          <i data-lucide="layout-dashboard" style="width: 0.85rem; height: 0.85rem;"></i> Primary Budget
        </label>
        <select id="mp-select-budget" class="select-field">
          <option value="">-- Select Scenario --</option>
          ${state.dashboards
            .map((d) => `<option value="${d.id}" ${mp.budgetId == d.id ? "selected" : ""}>${escapeHtml(d.name)}</option>`)
            .join("")}
        </select>
      </div>

      <div class="glass-card" style="padding: 1rem 1.15rem;">
        <label class="input-label" style="color: var(--brand-emerald); margin-bottom: 0.4rem;">
          <i data-lucide="home" style="width: 0.85rem; height: 0.85rem;"></i> Primary Rent
        </label>
        <select id="mp-select-rent" class="select-field">
          <option value="">-- Select Scenario --</option>
          ${state.rents
            .map((r) => `<option value="${r.id}" ${mp.rentId == r.id ? "selected" : ""}>${escapeHtml(r.name)}</option>`)
            .join("")}
        </select>
      </div>

      <div class="glass-card" style="padding: 1rem 1.15rem;">
        <label class="input-label" style="color: var(--brand-rose); margin-bottom: 0.4rem;">
          <i data-lucide="landmark" style="width: 0.85rem; height: 0.85rem;"></i> Focus Loan
        </label>
        <select id="mp-select-loan" class="select-field">
          <option value="">-- Select Scenario --</option>
          ${state.loans
            .map((l) => `<option value="${l.id}" ${mp.loanId == l.id ? "selected" : ""}>${escapeHtml(l.name)}</option>`)
            .join("")}
        </select>
      </div>

      <div class="glass-card" style="padding: 1rem 1.15rem;">
        <label class="input-label" style="color: var(--brand-blue); margin-bottom: 0.4rem;">
          <i data-lucide="trending-up" style="width: 0.85rem; height: 0.85rem;"></i> Focus APY
        </label>
        <select id="mp-select-inv" class="select-field">
          <option value="">-- Select Scenario --</option>
          ${state.investments
            .map((i) => `<option value="${i.id}" ${mp.invId == i.id ? "selected" : ""}>${escapeHtml(i.name)}</option>`)
            .join("")}
        </select>
      </div>
    </div>

    <!-- Hero Section: Net Worth Overview -->
    <div class="net-worth-hero">
      <div>
        <p class="net-worth-label tooltip-help" title="Aggregated starting balance of all Savings & Goals minus outstanding Loans.">
          Total Starting Net Worth
        </p>
        <h1 class="net-worth-amount font-mono overview-net-worth">
          ${fmt.format(overviewMetrics.netWorth)}
        </h1>
      </div>
      <div class="net-worth-stats">
        <div class="net-worth-stat-box">
          <p class="net-worth-stat-label">Total Assets</p>
          <p class="net-worth-stat-value font-mono overview-total-assets">${fmt.format(overviewMetrics.totalAssets)}</p>
        </div>
        <div class="net-worth-stat-box dark-box">
          <p class="net-worth-stat-label">Total Debt</p>
          <p class="net-worth-stat-value font-mono overview-total-debt" style="color: #fca5a5;">${fmt.format(overviewMetrics.totalDebt)}</p>
        </div>
      </div>
    </div>

    <!-- Monthly Cash Flow Snapshot -->
    ${
      activeBudget && budgetMetrics
        ? `
      <div class="cards-grid cards-grid-3" style="margin-bottom: 1.5rem;">
        <div class="glass-card" style="padding: 1.35rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h3 class="metric-label">Monthly Inflow</h3>
            <div style="padding: 0.4rem; background: var(--brand-emerald-dim); border-radius: var(--radius-md); color: var(--brand-emerald);">
              <i data-lucide="arrow-down-left" style="width: 1.15rem; height: 1.15rem;"></i>
            </div>
          </div>
          <p class="metric-value font-mono overview-cash-in" style="color: var(--brand-emerald);">${fmt.format(budgetMetrics.monthlyInc)}</p>
          <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">Primary pay & extra income</p>
        </div>

        <div class="glass-card" style="padding: 1.35rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h3 class="metric-label">Monthly Outflow</h3>
            <div style="padding: 0.4rem; background: var(--brand-rose-dim); border-radius: var(--radius-md); color: var(--brand-rose);">
              <i data-lucide="arrow-up-right" style="width: 1.15rem; height: 1.15rem;"></i>
            </div>
          </div>
          <p class="metric-value font-mono overview-cash-out" style="color: var(--brand-rose);">${fmt.format(budgetMetrics.monthlyExp)}</p>
          <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">Expenses, housing, debt & savings</p>
        </div>

        <div class="glass-card" style="padding: 1.35rem; border-color: rgba(14, 165, 233, 0.4);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h3 class="metric-label" style="color: var(--brand-teal);">Net Monthly Wiggle Room</h3>
            <div style="padding: 0.4rem; background: var(--brand-teal-dim); border-radius: var(--radius-md); color: var(--brand-teal);">
              <i data-lucide="wallet" style="width: 1.15rem; height: 1.15rem;"></i>
            </div>
          </div>
          <p class="metric-value font-mono overview-wiggle" style="color: var(--brand-teal);">${fmt.format(budgetMetrics.netMonthly)}</p>
          <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">Unallocated discretionary buffer</p>
        </div>
      </div>

      <!-- Financial Health Gauges -->
      <div class="cards-grid cards-grid-2">
        <div class="glass-card" style="padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span class="metric-label">Savings & Investment Rate</span>
            <span class="font-mono overview-savings-rate" style="font-weight: 800; color: var(--brand-emerald); font-size: 1.1rem;">
              ${Math.round(budgetMetrics.savingsRate)}%
            </span>
          </div>
          <div class="progress-track" style="margin-bottom: 0.5rem;">
            <div class="progress-fill overview-savings-bar bg-emerald-500" style="width: ${budgetMetrics.savingsRate}%;"></div>
          </div>
          <p style="font-size: 0.75rem; color: var(--text-muted);">
            Percentage of monthly cash flow directed into high-yield savings, goals, or retained wiggle room.
          </p>
        </div>

        <div class="glass-card" style="padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span class="metric-label">Emergency Runway Targets</span>
            <span class="font-mono" style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted);">
              3-Mo / 6-Mo
            </span>
          </div>
          <div style="display: flex; gap: 0.75rem; margin-top: 0.35rem;">
            <div class="metric-box" style="flex: 1; padding: 0.5rem 0.75rem;">
              <div>
                <p style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600;">3 Months</p>
                <p class="font-mono overview-runway-3mo" style="font-weight: 700; font-size: 0.95rem;">${fmt.format(budgetMetrics.emergencyFund3Mo)}</p>
              </div>
            </div>
            <div class="metric-box" style="flex: 1; padding: 0.5rem 0.75rem; border-color: var(--brand-blue-dim);">
              <div>
                <p style="font-size: 0.7rem; color: var(--brand-blue); font-weight: 600;">6 Months</p>
                <p class="font-mono overview-runway-6mo" style="font-weight: 700; font-size: 0.95rem; color: var(--brand-blue);">${fmt.format(budgetMetrics.emergencyFund6Mo)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
        : `
      <div class="glass-card" style="padding: 3rem 1.5rem; text-align: center;">
        <i data-lucide="compass" style="width: 2.5rem; height: 2.5rem; margin: 0 auto 0.75rem; color: var(--brand-teal);"></i>
        <p style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem;">
          Select a Primary Budget scenario above
        </p>
        <p style="font-size: 0.825rem; color: var(--text-muted);">
          Your consolidated cash flow, savings rate, and emergency runway will populate automatically.
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
