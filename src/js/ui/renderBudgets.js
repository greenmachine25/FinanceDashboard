/**
 * Budget Scenarios Tab Renderer (Ultra-responsive, zero-lag in-place typing)
 */

import { fmt, cardColors, refreshIcons, parseNum, escapeHtml } from "../utils.js";
import { calcBudgetMetrics, calcRentMetrics, calcLoanMetrics } from "../calculations.js";
import { updateStateSilently } from "../state.js";
import { initSortableContainer } from "./dragDrop.js";

export function updateBudgetCardMetrics(cardEl, dash, state) {
  if (!cardEl || !dash) return;
  const metrics = calcBudgetMetrics(dash, state);
  if (!metrics) return;

  const dailyEl = cardEl.querySelector(".dash-m-daily");
  const monthlyEl = cardEl.querySelector(".dash-m-monthly");
  const yearlyEl = cardEl.querySelector(".dash-m-yearly");
  const wiggleEl = cardEl.querySelector(".dash-m-wiggle");
  const expTotalEl = cardEl.querySelector(".dash-m-exp-total");

  if (dailyEl) dailyEl.innerText = fmt.format(metrics.dailyInc);
  if (monthlyEl) monthlyEl.innerText = fmt.format(metrics.monthlyInc);
  if (yearlyEl) yearlyEl.innerText = fmt.format(metrics.yearlyInc);
  if (wiggleEl) wiggleEl.innerText = fmt.format(metrics.netMonthly);
  if (expTotalEl) expTotalEl.innerText = `Total monthly obligations: ${fmt.format(metrics.monthlyExp)}`;
}

export function renderBudgets(container, state, handlers) {
  if (!container || !state) return;

  const {
    onUpdateLinkedItem,
    onToggleMinimize,
    onUpdateColor,
    onDuplicate,
    onDelete,
    onAddExpense,
    onDeleteExpense,
    onAddEarning,
    onDeleteEarning,
    onFastUpdate,
  } = handlers;

  if (state.dashboards.length === 0) {
    container.innerHTML = `
      <div class="glass-card" style="grid-column: 1 / -1; padding: 3.5rem 1.5rem; text-align: center;">
        <i data-lucide="layout-dashboard" style="width: 2.5rem; height: 2.5rem; margin: 0 auto 0.75rem; color: var(--brand-teal);"></i>
        <p style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem;">
          No Budget Scenarios Created Yet
        </p>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem; max-width: 28rem; margin-left: auto; margin-right: auto;">
          Model your net take-home pay, recurring living costs, and calculate your exact monthly discretionary wiggle room.
        </p>
        <button id="emptyAddDashboardBtn" class="btn btn-primary" style="margin: 0 auto;">
          <i data-lucide="plus" style="width: 1rem; height: 1rem;"></i> Create First Budget Scenario
        </button>
      </div>
    `;
    container.querySelector("#emptyAddDashboardBtn")?.addEventListener("click", () => {
      document.getElementById("addDashboardBtn")?.click();
    });
    refreshIcons();
    return;
  }

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
              <i data-lucide="grip-vertical" class="drag-handle" style="width: 1.15rem; height: 1.15rem;"></i>
              <input type="text" value="${escapeHtml(dash.name)}" data-dash-id="${dash.id}" class="dash-name-input"
                style="font-size: 1.1rem; font-weight: 700; background: transparent; border: none; outline: none; color: var(--text-main); width: 100%;"
                placeholder="Scenario Name">
            </div>

            <div style="display: flex; align-items: center; gap: 0.35rem;">
              <div class="color-picker-dropdown">
                <button class="icon-btn color-picker-toggle" title="Change Color">
                  <i data-lucide="palette" style="width: 0.95rem; height: 0.95rem;"></i>
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
                <i data-lucide="${isMin ? "chevron-down" : "chevron-up"}" style="width: 0.95rem; height: 0.95rem;"></i>
              </button>

              <button class="icon-btn dash-dup-btn" data-dash-id="${dash.id}" title="Duplicate Scenario">
                <i data-lucide="copy" style="width: 0.95rem; height: 0.95rem;"></i>
              </button>

              <button class="icon-btn dash-del-btn" data-dash-id="${dash.id}" title="Delete Scenario" style="color: var(--brand-rose);">
                <i data-lucide="trash-2" style="width: 0.95rem; height: 0.95rem;"></i>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="card-body ${isMin ? "hidden" : ""}" style="${isMin ? "display: none;" : ""}">
            <!-- Inputs Row -->
            <div class="cards-grid cards-grid-2">
              <div class="input-group">
                <label class="input-label tooltip-help" title="Net take-home pay per week.">
                  Weekly Income (Net)
                </label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix">$</span>
                  <input type="text" inputmode="decimal" value="${escapeHtml(dash.income)}" placeholder="0.00"
                    class="input-field dash-income-input" data-dash-id="${dash.id}">
                </div>
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" style="color: var(--brand-emerald);" title="Link a housing scenario to deduct rent & utilities.">
                  <i data-lucide="link" style="width: 0.75rem; height: 0.75rem;"></i> Linked Rent
                </label>
                <select class="select-field dash-link-rent" data-dash-id="${dash.id}">
                  <option value="">-- None --</option>
                  ${state.rents
                    .map((r) => {
                      const rm = calcRentMetrics(r);
                      return `<option value="${r.id}" ${dash.linkedRentId == r.id ? "selected" : ""}>${escapeHtml(r.name)} (${fmt.format(rm.totalMonthly)}/mo)</option>`;
                    })
                    .join("")}
                </select>
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" style="color: var(--brand-rose);" title="Link an active loan scenario to deduct payment.">
                  <i data-lucide="link" style="width: 0.75rem; height: 0.75rem;"></i> Linked Loan
                </label>
                <select class="select-field dash-link-loan" data-dash-id="${dash.id}">
                  <option value="">-- None --</option>
                  ${state.loans
                    .map((l) => {
                      const lm = calcLoanMetrics(l);
                      return `<option value="${l.id}" ${dash.linkedLoanId == l.id ? "selected" : ""}>${escapeHtml(l.name)} (${fmt.format(lm.actualPayment)}/mo)</option>`;
                    })
                    .join("")}
                </select>
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" style="color: var(--brand-blue);" title="Link a high-yield APY account deposit.">
                  <i data-lucide="link" style="width: 0.75rem; height: 0.75rem;"></i> Linked Savings
                </label>
                <select class="select-field dash-link-inv" data-dash-id="${dash.id}">
                  <option value="">-- None --</option>
                  ${state.investments
                    .map((i) => `<option value="${i.id}" ${dash.linkedInvestmentId == i.id ? "selected" : ""}>${escapeHtml(i.name)} (${fmt.format(parseNum(i.monthly))}/mo)</option>`)
                    .join("")}
                </select>
              </div>
            </div>

            <!-- Income Breakdown Chips -->
            <div class="cards-grid cards-grid-3" style="gap: 0.5rem;">
              <div class="metric-box" style="padding: 0.65rem 0.85rem;">
                <div>
                  <p class="metric-label">Daily</p>
                  <p class="font-mono dash-m-daily" style="font-weight: 700; font-size: 0.95rem;">${fmt.format(metrics.dailyInc)}</p>
                </div>
              </div>
              <div class="metric-box" style="padding: 0.65rem 0.85rem; border-color: rgba(14, 165, 233, 0.3);">
                <div>
                  <p class="metric-label" style="color: var(--brand-teal);">Monthly</p>
                  <p class="font-mono dash-m-monthly" style="font-weight: 700; font-size: 0.95rem; color: var(--brand-teal);">${fmt.format(metrics.monthlyInc)}</p>
                </div>
              </div>
              <div class="metric-box" style="padding: 0.65rem 0.85rem; border-color: rgba(59, 130, 246, 0.3);">
                <div>
                  <p class="metric-label" style="color: var(--brand-blue);">Yearly</p>
                  <p class="font-mono dash-m-yearly" style="font-weight: 700; font-size: 0.95rem; color: var(--brand-blue);">${fmt.format(metrics.yearlyInc)}</p>
                </div>
              </div>
            </div>

            <!-- Expenses Section -->
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 0.85rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
                <span class="input-label">Recurring Expenses</span>
                <button class="btn btn-secondary btn-sm add-exp-btn" data-dash-id="${dash.id}">
                  <i data-lucide="plus" style="width: 0.8rem; height: 0.8rem;"></i> Add Item
                </button>
              </div>
              <div class="space-y-2">
                ${
                  dash.expenses.length === 0
                    ? '<p style="font-size: 0.775rem; color: var(--text-muted); font-style: italic;">No specific recurring expenses added yet.</p>'
                    : dash.expenses
                        .map(
                          (exp) => `
                    <div style="display: flex; gap: 0.45rem; align-items: center; background: var(--bg-surface-input); padding: 0.4rem 0.6rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
                      <input type="text" placeholder="Expense description" value="${escapeHtml(exp.name)}"
                        class="input-field exp-name-input" data-dash-id="${dash.id}" data-exp-id="${exp.id}"
                        style="padding: 0.35rem 0.6rem; font-size: 0.825rem; flex: 1;">
                      <div class="currency-input-wrapper" style="width: 6.8rem;">
                        <span class="currency-prefix" style="left: 0.5rem; font-size: 0.775rem;">$</span>
                        <input type="text" inputmode="decimal" placeholder="0.00" value="${escapeHtml(exp.amount)}"
                          class="input-field exp-amt-input" data-dash-id="${dash.id}" data-exp-id="${exp.id}"
                          style="padding: 0.35rem 0.45rem 0.35rem 1.35rem; font-size: 0.825rem;">
                      </div>
                      <select class="select-field exp-freq-select" data-dash-id="${dash.id}" data-exp-id="${exp.id}"
                        style="padding: 0.35rem 0.45rem; font-size: 0.775rem; width: 4.2rem; font-weight: 700;">
                        <option value="weekly" ${exp.freq === "weekly" ? "selected" : ""}>Wk</option>
                        <option value="monthly" ${exp.freq === "monthly" ? "selected" : ""}>Mo</option>
                        <option value="yearly" ${exp.freq === "yearly" ? "selected" : ""}>Yr</option>
                      </select>
                      <button class="icon-btn exp-del-btn" data-dash-id="${dash.id}" data-exp-id="${exp.id}" title="Remove item" style="width: 1.85rem; height: 1.85rem; color: var(--brand-rose);">
                        <i data-lucide="trash-2" style="width: 0.8rem; height: 0.8rem;"></i>
                      </button>
                    </div>
                  `
                        )
                        .join("")
                }
              </div>
            </div>

            <!-- Extra Earnings Section -->
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 0.85rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
                <span class="input-label" style="color: var(--brand-teal);">Supplemental Earnings</span>
                <button class="btn btn-secondary btn-sm add-earn-btn" data-dash-id="${dash.id}">
                  <i data-lucide="plus" style="width: 0.8rem; height: 0.8rem;"></i> Add Income
                </button>
              </div>
              <div class="space-y-2">
                ${
                  dash.earnings.length === 0
                    ? '<p style="font-size: 0.775rem; color: var(--text-muted); font-style: italic;">No extra side-income sources added.</p>'
                    : dash.earnings
                        .map(
                          (earn) => `
                    <div style="display: flex; gap: 0.45rem; align-items: center; background: var(--bg-surface-input); padding: 0.4rem 0.6rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
                      <input type="text" placeholder="Side-gig / dividend" value="${escapeHtml(earn.name)}"
                        class="input-field earn-name-input" data-dash-id="${dash.id}" data-earn-id="${earn.id}"
                        style="padding: 0.35rem 0.6rem; font-size: 0.825rem; flex: 1;">
                      <div class="currency-input-wrapper" style="width: 6.8rem;">
                        <span class="currency-prefix" style="left: 0.5rem; font-size: 0.775rem; color: var(--brand-teal);">$</span>
                        <input type="text" inputmode="decimal" placeholder="0.00" value="${escapeHtml(earn.amount)}"
                          class="input-field earn-amt-input" data-dash-id="${dash.id}" data-earn-id="${earn.id}"
                          style="padding: 0.35rem 0.45rem 0.35rem 1.35rem; font-size: 0.825rem; color: var(--brand-teal); font-weight: 700;">
                      </div>
                      <select class="select-field earn-freq-select" data-dash-id="${dash.id}" data-earn-id="${earn.id}"
                        style="padding: 0.35rem 0.45rem; font-size: 0.775rem; width: 4.2rem; font-weight: 700; color: var(--brand-teal);">
                        <option value="weekly" ${earn.freq === "weekly" ? "selected" : ""}>Wk</option>
                        <option value="monthly" ${earn.freq === "monthly" ? "selected" : ""}>Mo</option>
                        <option value="yearly" ${earn.freq === "yearly" ? "selected" : ""}>Yr</option>
                      </select>
                      <button class="icon-btn earn-del-btn" data-dash-id="${dash.id}" data-earn-id="${earn.id}" title="Remove item" style="width: 1.85rem; height: 1.85rem; color: var(--brand-rose);">
                        <i data-lucide="trash-2" style="width: 0.8rem; height: 0.8rem;"></i>
                      </button>
                    </div>
                  `
                        )
                        .join("")
                }
              </div>
            </div>
          </div>

          <!-- Footer: Net Wiggle Room Summary -->
          <div class="card-footer ${isMin ? "hidden" : ""}" style="${isMin ? "display: none;" : ""}">
            <div class="metric-box" style="border-color: rgba(14, 165, 233, 0.35); background: var(--bg-surface-elevated);">
              <div>
                <span class="metric-label" style="color: var(--brand-teal);">Net Monthly Wiggle Room</span>
                <p class="dash-m-exp-total" style="font-size: 0.725rem; color: var(--text-muted); margin-top: 0.15rem;">
                  Total monthly obligations: ${fmt.format(metrics.monthlyExp)}
                </p>
              </div>
              <span class="font-mono dash-m-wiggle" style="font-size: 1.5rem; font-weight: 800; color: var(--brand-teal);">${fmt.format(metrics.netMonthly)}</span>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  // Live Input Event Handlers (In-place instant metric update without destroying DOM)
  container.querySelectorAll(".dash-income-input").forEach((input) => {
    input.oninput = (e) => {
      const dashId = parseInt(e.target.dataset.dashId);
      const dash = state.dashboards.find((d) => d.id === dashId);
      if (dash) {
        dash.income = e.target.value;
        const cardEl = document.getElementById(`dash-${dashId}`);
        updateBudgetCardMetrics(cardEl, dash, state);
        if (typeof onFastUpdate === "function") onFastUpdate();
        updateStateSilently((s) => {
          const d = s.dashboards.find((x) => x.id === dashId);
          if (d) d.income = e.target.value;
        });
      }
    };
  });

  container.querySelectorAll(".dash-name-input").forEach((input) => {
    input.oninput = (e) => {
      const dashId = parseInt(e.target.dataset.dashId);
      const dash = state.dashboards.find((d) => d.id === dashId);
      if (dash) {
        dash.name = e.target.value;
        updateStateSilently((s) => {
          const d = s.dashboards.find((x) => x.id === dashId);
          if (d) d.name = e.target.value;
        });
      }
    };
  });

  container.querySelectorAll(".exp-name-input").forEach((input) => {
    input.oninput = (e) => {
      const dashId = parseInt(e.target.dataset.dashId);
      const expId = parseInt(e.target.dataset.expId);
      const dash = state.dashboards.find((d) => d.id === dashId);
      if (dash) {
        const exp = dash.expenses.find((x) => x.id === expId);
        if (exp) {
          exp.name = e.target.value;
          updateStateSilently((s) => {
            const d = s.dashboards.find((x) => x.id === dashId);
            if (d) {
              const ex = d.expenses.find((x) => x.id === expId);
              if (ex) ex.name = e.target.value;
            }
          });
        }
      }
    };
  });

  container.querySelectorAll(".exp-amt-input").forEach((input) => {
    input.oninput = (e) => {
      const dashId = parseInt(e.target.dataset.dashId);
      const expId = parseInt(e.target.dataset.expId);
      const dash = state.dashboards.find((d) => d.id === dashId);
      if (dash) {
        const exp = dash.expenses.find((x) => x.id === expId);
        if (exp) {
          exp.amount = e.target.value;
          const cardEl = document.getElementById(`dash-${dashId}`);
          updateBudgetCardMetrics(cardEl, dash, state);
          if (typeof onFastUpdate === "function") onFastUpdate();
          updateStateSilently((s) => {
            const d = s.dashboards.find((x) => x.id === dashId);
            if (d) {
              const ex = d.expenses.find((x) => x.id === expId);
              if (ex) ex.amount = e.target.value;
            }
          });
        }
      }
    };
  });

  container.querySelectorAll(".exp-freq-select").forEach((sel) => {
    sel.onchange = (e) => {
      const dashId = parseInt(e.target.dataset.dashId);
      const expId = parseInt(e.target.dataset.expId);
      const dash = state.dashboards.find((d) => d.id === dashId);
      if (dash) {
        const exp = dash.expenses.find((x) => x.id === expId);
        if (exp) {
          exp.freq = e.target.value;
          const cardEl = document.getElementById(`dash-${dashId}`);
          updateBudgetCardMetrics(cardEl, dash, state);
          if (typeof onFastUpdate === "function") onFastUpdate();
          updateStateSilently((s) => {
            const d = s.dashboards.find((x) => x.id === dashId);
            if (d) {
              const ex = d.expenses.find((x) => x.id === expId);
              if (ex) ex.freq = e.target.value;
            }
          });
        }
      }
    };
  });

  container.querySelectorAll(".earn-name-input").forEach((input) => {
    input.oninput = (e) => {
      const dashId = parseInt(e.target.dataset.dashId);
      const earnId = parseInt(e.target.dataset.earnId);
      const dash = state.dashboards.find((d) => d.id === dashId);
      if (dash) {
        const earn = dash.earnings.find((x) => x.id === earnId);
        if (earn) {
          earn.name = e.target.value;
          updateStateSilently((s) => {
            const d = s.dashboards.find((x) => x.id === dashId);
            if (d) {
              const ea = d.earnings.find((x) => x.id === earnId);
              if (ea) ea.name = e.target.value;
            }
          });
        }
      }
    };
  });

  container.querySelectorAll(".earn-amt-input").forEach((input) => {
    input.oninput = (e) => {
      const dashId = parseInt(e.target.dataset.dashId);
      const earnId = parseInt(e.target.dataset.earnId);
      const dash = state.dashboards.find((d) => d.id === dashId);
      if (dash) {
        const earn = dash.earnings.find((x) => x.id === earnId);
        if (earn) {
          earn.amount = e.target.value;
          const cardEl = document.getElementById(`dash-${dashId}`);
          updateBudgetCardMetrics(cardEl, dash, state);
          if (typeof onFastUpdate === "function") onFastUpdate();
          updateStateSilently((s) => {
            const d = s.dashboards.find((x) => x.id === dashId);
            if (d) {
              const ea = d.earnings.find((x) => x.id === earnId);
              if (ea) ea.amount = e.target.value;
            }
          });
        }
      }
    };
  });

  container.querySelectorAll(".earn-freq-select").forEach((sel) => {
    sel.onchange = (e) => {
      const dashId = parseInt(e.target.dataset.dashId);
      const earnId = parseInt(e.target.dataset.earnId);
      const dash = state.dashboards.find((d) => d.id === dashId);
      if (dash) {
        const earn = dash.earnings.find((x) => x.id === earnId);
        if (earn) {
          earn.freq = e.target.value;
          const cardEl = document.getElementById(`dash-${dashId}`);
          updateBudgetCardMetrics(cardEl, dash, state);
          if (typeof onFastUpdate === "function") onFastUpdate();
          updateStateSilently((s) => {
            const d = s.dashboards.find((x) => x.id === dashId);
            if (d) {
              const ea = d.earnings.find((x) => x.id === earnId);
              if (ea) ea.freq = e.target.value;
            }
          });
        }
      }
    };
  });

  // Linked item selectors (updates link and recalculates)
  container.querySelectorAll(".dash-link-rent").forEach((sel) => {
    sel.onchange = (e) => onUpdateLinkedItem(parseInt(e.target.dataset.dashId), "linkedRentId", e.target.value);
  });

  container.querySelectorAll(".dash-link-loan").forEach((sel) => {
    sel.onchange = (e) => onUpdateLinkedItem(parseInt(e.target.dataset.dashId), "linkedLoanId", e.target.value);
  });

  container.querySelectorAll(".dash-link-inv").forEach((sel) => {
    sel.onchange = (e) => onUpdateLinkedItem(parseInt(e.target.dataset.dashId), "linkedInvestmentId", e.target.value);
  });

  // Structural Actions (triggers full re-render)
  container.querySelectorAll(".dash-min-toggle").forEach((btn) => {
    btn.onclick = (e) => onToggleMinimize("dashboard", parseInt(e.currentTarget.dataset.dashId));
  });

  container.querySelectorAll(".dash-dup-btn").forEach((btn) => {
    btn.onclick = (e) => onDuplicate(parseInt(e.currentTarget.dataset.dashId));
  });

  container.querySelectorAll(".dash-del-btn").forEach((btn) => {
    btn.onclick = (e) => onDelete(parseInt(e.currentTarget.dataset.dashId));
  });

  container.querySelectorAll(".color-picker-toggle").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const menu = btn.nextElementSibling;
      menu.classList.toggle("hidden");
    };
  });

  container.querySelectorAll(".color-swatch").forEach((swatch) => {
    swatch.onclick = (e) => {
      onUpdateColor("dashboard", parseInt(e.target.dataset.dashId), e.target.dataset.color);
    };
  });

  container.querySelectorAll(".add-exp-btn").forEach((btn) => {
    btn.onclick = (e) => onAddExpense(parseInt(e.currentTarget.dataset.dashId));
  });

  container.querySelectorAll(".exp-del-btn").forEach((btn) => {
    btn.onclick = (e) => onDeleteExpense(parseInt(e.currentTarget.dataset.dashId), parseInt(e.currentTarget.dataset.expId));
  });

  container.querySelectorAll(".add-earn-btn").forEach((btn) => {
    btn.onclick = (e) => onAddEarning(parseInt(e.currentTarget.dataset.dashId));
  });

  container.querySelectorAll(".earn-del-btn").forEach((btn) => {
    btn.onclick = (e) => onDeleteEarning(parseInt(e.currentTarget.dataset.dashId), parseInt(e.currentTarget.dataset.earnId));
  });

  initSortableContainer(container, "dashboard", handlers.onReorder);
  refreshIcons();
}
