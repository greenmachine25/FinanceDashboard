/**
 * Budget Scenarios Tab Renderer
 */

import { fmt, cardColors, refreshIcons, parseNum } from "../utils.js";
import { calcBudgetMetrics, calcRentMetrics, calcLoanMetrics } from "../calculations.js";
import { initSortableContainer } from "./dragDrop.js";

export function renderBudgets(container, state, handlers) {
  if (!container || !state) return;

  const {
    onUpdateName,
    onUpdateIncome,
    onUpdateLinkedItem,
    onToggleMinimize,
    onUpdateColor,
    onDuplicate,
    onDelete,
    onAddExpense,
    onUpdateExpense,
    onDeleteExpense,
    onAddEarning,
    onUpdateEarning,
    onDeleteEarning,
  } = handlers;

  container.innerHTML = state.dashboards
    .map((dash) => {
      const metrics = calcBudgetMetrics(dash, state);
      const isMin = !!dash.isMinimized;

      return `
        <div id="dash-${dash.id}" class="glass-card flex flex-col h-full">
          <div class="card-flair-bar ${dash.color || "bg-teal-500"}"></div>

          <!-- Header -->
          <div class="card-header">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0;">
              <i data-lucide="grip-vertical" class="drag-handle" style="width: 1.25rem; height: 1.25rem;"></i>
              <input type="text" value="${dash.name}" data-dash-id="${dash.id}" class="dash-name-input"
                style="font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; background: transparent; border: none; outline: none; color: var(--text-main); width: 100%;"
                placeholder="Scenario Name">
            </div>

            <div style="display: flex; align-items: center; gap: 0.35rem;">
              <div class="color-picker-dropdown">
                <button class="icon-btn color-picker-toggle" title="Change Color">
                  <i data-lucide="palette" style="width: 1rem; height: 1rem;"></i>
                </button>
                <div class="color-palette-menu hidden">
                  ${cardColors
                    .map(
                      (c) =>
                        `<button class="color-swatch ${c} ${dash.color === c ? "active" : ""}" data-dash-id="${dash.id}" data-color="${c}"></button>`
                    )
                    .join("")}
                </div>
              </div>

              <button class="icon-btn dash-min-toggle" data-dash-id="${dash.id}" title="${isMin ? "Expand" : "Minimize"}">
                <i data-lucide="${isMin ? "chevron-down" : "chevron-up"}" style="width: 1rem; height: 1rem;"></i>
              </button>

              <button class="icon-btn dash-dup-btn" data-dash-id="${dash.id}" title="Duplicate Scenario">
                <i data-lucide="copy" style="width: 1rem; height: 1rem;"></i>
              </button>

              <button class="icon-btn dash-del-btn" data-dash-id="${dash.id}" title="Delete Scenario" style="color: var(--brand-rose);">
                <i data-lucide="trash-2" style="width: 1rem; height: 1rem;"></i>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="card-body ${isMin ? "hidden" : ""}" style="${isMin ? "display: none;" : ""}">
            <!-- Inputs Row -->
            <div class="cards-grid cards-grid-2">
              <div class="input-group">
                <label class="input-label tooltip-help" title="Primary take-home weekly pay after deductions.">
                  Primary Weekly Income (Net)
                </label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix">$</span>
                  <input type="text" inputmode="decimal" value="${dash.income || ""}" placeholder="0.00"
                    class="input-field dash-income-input" data-dash-id="${dash.id}">
                </div>
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help text-brand-teal" style="color: var(--brand-teal);" title="Deducts this rent's monthly cost from wiggle room.">
                  <i data-lucide="link" style="width: 0.8rem; height: 0.8rem;"></i> Linked Rent
                </label>
                <select class="select-field dash-link-rent" data-dash-id="${dash.id}">
                  <option value="">-- None --</option>
                  ${state.rents
                    .map((r) => {
                      const rm = calcRentMetrics(r);
                      return `<option value="${r.id}" ${dash.linkedRentId == r.id ? "selected" : ""}>${r.name} (${fmt.format(rm.totalMonthly)}/mo)</option>`;
                    })
                    .join("")}
                </select>
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help text-brand-teal" style="color: var(--brand-teal);" title="Deducts this loan's payment from wiggle room.">
                  <i data-lucide="link" style="width: 0.8rem; height: 0.8rem;"></i> Linked Loan
                </label>
                <select class="select-field dash-link-loan" data-dash-id="${dash.id}">
                  <option value="">-- None --</option>
                  ${state.loans
                    .map((l) => {
                      const lm = calcLoanMetrics(l);
                      return `<option value="${l.id}" ${dash.linkedLoanId == l.id ? "selected" : ""}>${l.name} (${fmt.format(lm.actualPayment)}/mo)</option>`;
                    })
                    .join("")}
                </select>
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help text-brand-blue" style="color: var(--brand-blue);" title="Deducts this monthly investment contribution.">
                  <i data-lucide="link" style="width: 0.8rem; height: 0.8rem;"></i> Linked Investment
                </label>
                <select class="select-field dash-link-inv" data-dash-id="${dash.id}">
                  <option value="">-- None --</option>
                  ${state.investments
                    .map((i) => `<option value="${i.id}" ${dash.linkedInvestmentId == i.id ? "selected" : ""}>${i.name} (${fmt.format(parseNum(i.monthly))}/mo)</option>`)
                    .join("")}
                </select>
              </div>
            </div>

            <!-- Income Breakdown Chips -->
            <div class="cards-grid cards-grid-3" style="gap: 0.75rem;">
              <div class="metric-box" style="padding: 0.75rem 1rem;">
                <div>
                  <p class="metric-label">Daily</p>
                  <p class="font-mono" style="font-weight: 700;">${fmt.format(metrics.dailyInc)}</p>
                </div>
              </div>
              <div class="metric-box" style="padding: 0.75rem 1rem; border-color: var(--brand-teal);">
                <div>
                  <p class="metric-label" style="color: var(--brand-teal);">Monthly</p>
                  <p class="font-mono" style="font-weight: 700; color: var(--brand-teal);">${fmt.format(metrics.monthlyInc)}</p>
                </div>
              </div>
              <div class="metric-box" style="padding: 0.75rem 1rem; border-color: var(--brand-blue);">
                <div>
                  <p class="metric-label" style="color: var(--brand-blue);">Yearly</p>
                  <p class="font-mono" style="font-weight: 700; color: var(--brand-blue);">${fmt.format(metrics.yearlyInc)}</p>
                </div>
              </div>
            </div>

            <!-- Expenses Section -->
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <span class="input-label" style="font-size: 0.85rem;">Expenses</span>
                <button class="btn btn-secondary btn-sm add-exp-btn" data-dash-id="${dash.id}">
                  <i data-lucide="plus" style="width: 0.85rem; height: 0.85rem;"></i> Add Expense
                </button>
              </div>
              <div class="space-y-2">
                ${
                  dash.expenses.length === 0
                    ? '<p style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">No expenses added yet.</p>'
                    : dash.expenses
                        .map(
                          (exp) => `
                    <div style="display: flex; gap: 0.5rem; align-items: center; background: var(--bg-surface-input); padding: 0.5rem 0.75rem; border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); margin-bottom: 0.5rem;">
                      <input type="text" placeholder="Expense Name" value="${exp.name}"
                        class="input-field exp-name-input" data-dash-id="${dash.id}" data-exp-id="${exp.id}"
                        style="padding: 0.35rem 0.65rem; font-size: 0.85rem; flex: 1;">
                      <div class="currency-input-wrapper" style="width: 7.5rem;">
                        <span class="currency-prefix" style="left: 0.5rem; font-size: 0.8rem;">$</span>
                        <input type="text" inputmode="decimal" placeholder="0.00" value="${exp.amount}"
                          class="input-field exp-amt-input" data-dash-id="${dash.id}" data-exp-id="${exp.id}"
                          style="padding: 0.35rem 0.5rem 0.35rem 1.4rem; font-size: 0.85rem;">
                      </div>
                      <select class="select-field exp-freq-select" data-dash-id="${dash.id}" data-exp-id="${exp.id}"
                        style="padding: 0.35rem 0.5rem; font-size: 0.8rem; width: 4.5rem; font-weight: 700;">
                        <option value="weekly" ${exp.freq === "weekly" ? "selected" : ""}>Wk</option>
                        <option value="monthly" ${exp.freq === "monthly" ? "selected" : ""}>Mo</option>
                        <option value="yearly" ${exp.freq === "yearly" ? "selected" : ""}>Yr</option>
                      </select>
                      <button class="icon-btn exp-del-btn" data-dash-id="${dash.id}" data-exp-id="${exp.id}" title="Remove" style="width: 2rem; height: 2rem; color: var(--brand-rose);">
                        <i data-lucide="trash-2" style="width: 0.85rem; height: 0.85rem;"></i>
                      </button>
                    </div>
                  `
                        )
                        .join("")
                }
              </div>
            </div>

            <!-- Extra Earnings Section -->
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <span class="input-label text-brand-teal" style="font-size: 0.85rem; color: var(--brand-teal);">Extra Earnings</span>
                <button class="btn btn-secondary btn-sm add-earn-btn" data-dash-id="${dash.id}">
                  <i data-lucide="plus" style="width: 0.85rem; height: 0.85rem;"></i> Add Earning
                </button>
              </div>
              <div class="space-y-2">
                ${
                  dash.earnings.length === 0
                    ? '<p style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">No side income added.</p>'
                    : dash.earnings
                        .map(
                          (earn) => `
                    <div style="display: flex; gap: 0.5rem; align-items: center; background: var(--bg-surface-input); padding: 0.5rem 0.75rem; border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); margin-bottom: 0.5rem;">
                      <input type="text" placeholder="Earning Name" value="${earn.name}"
                        class="input-field earn-name-input" data-dash-id="${dash.id}" data-earn-id="${earn.id}"
                        style="padding: 0.35rem 0.65rem; font-size: 0.85rem; flex: 1;">
                      <div class="currency-input-wrapper" style="width: 7.5rem;">
                        <span class="currency-prefix" style="left: 0.5rem; font-size: 0.8rem;">$</span>
                        <input type="text" inputmode="decimal" placeholder="0.00" value="${earn.amount}"
                          class="input-field earn-amt-input" data-dash-id="${dash.id}" data-earn-id="${earn.id}"
                          style="padding: 0.35rem 0.5rem 0.35rem 1.4rem; font-size: 0.85rem;">
                      </div>
                      <select class="select-field earn-freq-select" data-dash-id="${dash.id}" data-earn-id="${earn.id}"
                        style="padding: 0.35rem 0.5rem; font-size: 0.8rem; width: 4.5rem; font-weight: 700;">
                        <option value="weekly" ${earn.freq === "weekly" ? "selected" : ""}>Wk</option>
                        <option value="monthly" ${earn.freq === "monthly" ? "selected" : ""}>Mo</option>
                        <option value="yearly" ${earn.freq === "yearly" ? "selected" : ""}>Yr</option>
                      </select>
                      <button class="icon-btn earn-del-btn" data-dash-id="${dash.id}" data-earn-id="${earn.id}" title="Remove" style="width: 2rem; height: 2rem; color: var(--brand-rose);">
                        <i data-lucide="trash-2" style="width: 0.85rem; height: 0.85rem;"></i>
                      </button>
                    </div>
                  `
                        )
                        .join("")
                }
              </div>
            </div>

            <!-- Disposable Income (Wiggle Room) Hero Card -->
            <div class="gradient-bg" style="padding: 1.5rem; border-radius: var(--radius-xl); color: #fff; box-shadow: var(--shadow-md);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div>
                  <h4 style="font-size: 1rem; font-weight: 700; color: #fff;">Disposable Income (Wiggle Room)</h4>
                  <p style="font-size: 0.725rem; opacity: 0.85;">After all expenses & linked goals</p>
                </div>
                <div style="background: rgba(255, 255, 255, 0.2); padding: 0.35rem 0.75rem; border-radius: var(--radius-md); font-size: 0.8rem; font-weight: 700; border: 1px solid rgba(255,255,255,0.25);">
                  Savings Rate: <span class="font-mono">${metrics.savingsRate.toFixed(1)}%</span>
                </div>
              </div>

              <div class="cards-grid cards-grid-3" style="text-align: left;">
                <div>
                  <p style="font-size: 0.7rem; text-transform: uppercase; opacity: 0.85; font-weight: 700;">Weekly</p>
                  <p class="font-mono" style="font-size: 1.35rem; font-weight: 700;">${fmt.format(metrics.netWeekly)}</p>
                </div>
                <div>
                  <p style="font-size: 0.7rem; text-transform: uppercase; opacity: 0.85; font-weight: 700;">Monthly</p>
                  <p class="font-mono" style="font-size: 1.35rem; font-weight: 700;">${fmt.format(metrics.netMonthly)}</p>
                </div>
                <div>
                  <p style="font-size: 0.7rem; text-transform: uppercase; opacity: 0.85; font-weight: 700;">Yearly</p>
                  <p class="font-mono" style="font-size: 1.35rem; font-weight: 700;">${fmt.format(metrics.netYearly)}</p>
                </div>
              </div>
            </div>

            <!-- Emergency Fund Targets -->
            <div class="cards-grid cards-grid-2">
              <div class="metric-box">
                <div>
                  <p class="metric-label tooltip-help" title="3 months of core essentials buffer.">3-Mo Emergency Fund</p>
                  <p class="font-mono" style="font-size: 1.15rem; font-weight: 700; color: var(--brand-teal);">${fmt.format(metrics.emergencyFund3Mo)}</p>
                </div>
              </div>
              <div class="metric-box">
                <div>
                  <p class="metric-label tooltip-help" title="6 months of core essentials buffer.">6-Mo Emergency Fund</p>
                  <p class="font-mono" style="font-size: 1.15rem; font-weight: 700; color: var(--brand-blue);">${fmt.format(metrics.emergencyFund6Mo)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  // Attach Event Listeners
  container.querySelectorAll(".dash-name-input").forEach((input) => {
    input.oninput = (e) => onUpdateName(parseInt(e.target.dataset.dashId), e.target.value);
  });

  container.querySelectorAll(".dash-income-input").forEach((input) => {
    input.oninput = (e) => onUpdateIncome(parseInt(e.target.dataset.dashId), e.target.value);
  });

  container.querySelectorAll(".dash-link-rent").forEach((sel) => {
    sel.onchange = (e) => onUpdateLinkedItem(parseInt(e.target.dataset.dashId), "linkedRentId", e.target.value);
  });

  container.querySelectorAll(".dash-link-loan").forEach((sel) => {
    sel.onchange = (e) => onUpdateLinkedItem(parseInt(e.target.dataset.dashId), "linkedLoanId", e.target.value);
  });

  container.querySelectorAll(".dash-link-inv").forEach((sel) => {
    sel.onchange = (e) => onUpdateLinkedItem(parseInt(e.target.dataset.dashId), "linkedInvestmentId", e.target.value);
  });

  container.querySelectorAll(".dash-min-toggle").forEach((btn) => {
    btn.onclick = (e) => onToggleMinimize("dashboard", parseInt(e.currentTarget.dataset.dashId));
  });

  container.querySelectorAll(".dash-dup-btn").forEach((btn) => {
    btn.onclick = (e) => onDuplicate(parseInt(e.currentTarget.dataset.dashId));
  });

  container.querySelectorAll(".dash-del-btn").forEach((btn) => {
    btn.onclick = (e) => onDelete(parseInt(e.currentTarget.dataset.dashId));
  });

  // Color Swatches
  container.querySelectorAll(".color-picker-toggle").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const menu = e.currentTarget.nextElementSibling;
      document.querySelectorAll(".color-palette-menu").forEach((m) => {
        if (m !== menu) m.classList.add("hidden");
      });
      menu.classList.toggle("hidden");
    };
  });

  container.querySelectorAll(".color-swatch").forEach((btn) => {
    btn.onclick = (e) => {
      const dashId = parseInt(e.currentTarget.dataset.dashId);
      const color = e.currentTarget.dataset.color;
      onUpdateColor("dashboard", dashId, color);
    };
  });

  // Expenses Listeners
  container.querySelectorAll(".add-exp-btn").forEach((btn) => {
    btn.onclick = (e) => onAddExpense(parseInt(e.currentTarget.dataset.dashId));
  });

  container.querySelectorAll(".exp-name-input").forEach((input) => {
    input.oninput = (e) =>
      onUpdateExpense(parseInt(e.target.dataset.dashId), parseFloat(e.target.dataset.expId), "name", e.target.value);
  });

  container.querySelectorAll(".exp-amt-input").forEach((input) => {
    input.oninput = (e) =>
      onUpdateExpense(parseInt(e.target.dataset.dashId), parseFloat(e.target.dataset.expId), "amount", e.target.value);
  });

  container.querySelectorAll(".exp-freq-select").forEach((sel) => {
    sel.onchange = (e) =>
      onUpdateExpense(parseInt(e.target.dataset.dashId), parseFloat(e.target.dataset.expId), "freq", e.target.value);
  });

  container.querySelectorAll(".exp-del-btn").forEach((btn) => {
    btn.onclick = (e) =>
      onDeleteExpense(parseInt(e.currentTarget.dataset.dashId), parseFloat(e.currentTarget.dataset.expId));
  });

  // Earnings Listeners
  container.querySelectorAll(".add-earn-btn").forEach((btn) => {
    btn.onclick = (e) => onAddEarning(parseInt(e.currentTarget.dataset.dashId));
  });

  container.querySelectorAll(".earn-name-input").forEach((input) => {
    input.oninput = (e) =>
      onUpdateEarning(parseInt(e.target.dataset.dashId), parseFloat(e.target.dataset.earnId), "name", e.target.value);
  });

  container.querySelectorAll(".earn-amt-input").forEach((input) => {
    input.oninput = (e) =>
      onUpdateEarning(parseInt(e.target.dataset.dashId), parseFloat(e.target.dataset.earnId), "amount", e.target.value);
  });

  container.querySelectorAll(".earn-freq-select").forEach((sel) => {
    sel.onchange = (e) =>
      onUpdateEarning(parseInt(e.target.dataset.dashId), parseFloat(e.target.dataset.earnId), "freq", e.target.value);
  });

  container.querySelectorAll(".earn-del-btn").forEach((btn) => {
    btn.onclick = (e) =>
      onDeleteEarning(parseInt(e.currentTarget.dataset.dashId), parseFloat(e.currentTarget.dataset.earnId));
  });

  initSortableContainer("dashboardsContainer", "dashboard", () => {});
  refreshIcons();
}
