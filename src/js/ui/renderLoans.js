/**
 * Loan Scenarios Tab Renderer
 */

import { fmt, cardColors, refreshIcons } from "../utils.js";
import { calcLoanMetrics } from "../calculations.js";
import { initSortableContainer } from "./dragDrop.js";

export function renderLoans(container, state, handlers) {
  if (!container || !state) return;

  const {
    onUpdateProp,
    onToggleMinimize,
    onUpdateColor,
    onDuplicate,
    onDelete,
    onShowAmortization,
    onShowSweetSpot,
    onOptimizeAccelerator,
  } = handlers;

  container.innerHTML = state.loans
    .map((loan) => {
      const metrics = calcLoanMetrics(loan);
      const isMin = !!loan.isMinimized;

      let effColor = "var(--brand-emerald)";
      if (metrics.efficiency < 15) effColor = "var(--brand-amber)";
      else if (metrics.efficiency < 50) effColor = "var(--brand-teal)";

      return `
        <div id="loan-${loan.id}" class="glass-card flex flex-col h-full">
          <div class="card-flair-bar ${loan.color || "bg-teal-500"}"></div>

          <!-- Header -->
          <div class="card-header">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0;">
              <i data-lucide="grip-vertical" class="drag-handle" style="width: 1.25rem; height: 1.25rem;"></i>
              <input type="text" value="${loan.name}" data-loan-id="${loan.id}" class="loan-name-input"
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
                        `<button class="color-swatch ${c} ${loan.color === c ? "active" : ""}" data-loan-id="${loan.id}" data-color="${c}"></button>`
                    )
                    .join("")}
                </div>
              </div>

              <button class="icon-btn loan-min-toggle" data-loan-id="${loan.id}" title="${isMin ? "Expand" : "Minimize"}">
                <i data-lucide="${isMin ? "chevron-down" : "chevron-up"}" style="width: 1rem; height: 1rem;"></i>
              </button>

              <button class="icon-btn loan-dup-btn" data-loan-id="${loan.id}" title="Duplicate Scenario">
                <i data-lucide="copy" style="width: 1rem; height: 1rem;"></i>
              </button>

              <button class="icon-btn loan-del-btn" data-loan-id="${loan.id}" title="Delete Scenario" style="color: var(--brand-rose);">
                <i data-lucide="trash-2" style="width: 1rem; height: 1rem;"></i>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="card-body ${isMin ? "hidden" : ""}" style="${isMin ? "display: none;" : ""}">
            <!-- Inputs -->
            <div class="cards-grid cards-grid-3" style="gap: 0.75rem;">
              <div class="input-group">
                <label class="input-label tooltip-help" title="Starting principal of the loan.">Orig. Amount</label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix">$</span>
                  <input type="text" inputmode="decimal" value="${loan.origAmount || ""}" placeholder="55000"
                    class="input-field loan-prop-input" data-loan-id="${loan.id}" data-prop="origAmount">
                </div>
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" title="What you still owe today.">Curr. Balance</label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix">$</span>
                  <input type="text" inputmode="decimal" value="${loan.amount || ""}" placeholder="43000"
                    class="input-field loan-prop-input" data-loan-id="${loan.id}" data-prop="amount">
                </div>
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" title="Annual Percentage Rate (APR).">Rate (%)</label>
                <input type="text" inputmode="decimal" value="${loan.rate || ""}" placeholder="5.5"
                  class="input-field loan-prop-input" data-loan-id="${loan.id}" data-prop="rate">
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" title="Original loan duration in years.">Orig. Term (Yrs)</label>
                <input type="text" inputmode="decimal" value="${loan.years || ""}" placeholder="5"
                  class="input-field loan-prop-input" data-loan-id="${loan.id}" data-prop="years">
              </div>

              <div class="input-group" style="grid-column: span 2;">
                <label class="input-label tooltip-help text-brand-teal" style="color: var(--brand-teal);" title="Overrides auto-calculated base payment.">
                  Manual Min. Payment ($)
                </label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix" style="color: var(--brand-teal);">$</span>
                  <input type="text" inputmode="decimal" value="${loan.minPaymentOverride || ""}" placeholder="Auto-Calculated"
                    class="input-field loan-prop-input" data-loan-id="${loan.id}" data-prop="minPaymentOverride"
                    style="border-color: rgba(14, 165, 233, 0.4); color: var(--brand-teal); font-weight: 700;">
                </div>
              </div>
            </div>

            <!-- Standard Metrics -->
            <div class="metric-box" style="background: rgba(59, 130, 246, 0.08); border-color: rgba(59, 130, 246, 0.2);">
              <div>
                <p class="metric-label" style="color: var(--brand-blue);">Standard Monthly Payment</p>
                <p class="font-mono" style="font-size: 1.5rem; font-weight: 800; color: var(--brand-blue);">${fmt.format(metrics.base_payment)}</p>
              </div>
              <div style="text-align: right;">
                <p class="metric-label" style="color: var(--brand-rose);">Remaining Interest</p>
                <p class="font-mono" style="font-size: 1.3rem; font-weight: 800; color: var(--brand-rose);">${fmt.format(metrics.base_interest)}</p>
              </div>
            </div>

            <!-- Initial Payment Breakdown -->
            <div style="background: rgba(244, 63, 94, 0.08); border: 1px solid rgba(244, 63, 94, 0.2); border-radius: var(--radius-xl); padding: 0.85rem 1rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.775rem; font-weight: 700; margin-bottom: 0.35rem;">
                <span style="color: var(--brand-rose);">Payment: Interest</span>
                <span style="color: var(--brand-teal);">Principal</span>
              </div>
              <div class="progress-track" style="background: rgba(14, 165, 233, 0.2); height: 0.5rem;">
                <div class="progress-fill" style="background: var(--brand-rose); width: ${metrics.int_pct}%;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.725rem; font-weight: 600; color: var(--text-muted); margin-top: 0.35rem;">
                <span class="font-mono">${fmt.format(metrics.first_mo_int)}</span>
                <span class="font-mono">${fmt.format(metrics.first_mo_prin)}</span>
              </div>
            </div>

            <!-- Payoff Accelerator -->
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
              <h4 class="input-label text-brand-teal" style="color: var(--brand-teal); margin-bottom: 0.75rem; font-size: 0.85rem;">
                <i data-lucide="rocket" style="width: 0.9rem; height: 0.9rem;"></i> Payoff Accelerator
              </h4>
              <div class="cards-grid cards-grid-2">
                <div class="input-group">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label class="input-label tooltip-help" title="A one-time large payment made today.">One-Time Lump Sum ($)</label>
                    <button class="btn btn-secondary btn-sm loan-opt-btn" data-loan-id="${loan.id}" data-mode="lump" style="padding: 0.15rem 0.5rem; font-size: 0.7rem;">
                      <i data-lucide="sparkles" style="width: 0.75rem; height: 0.75rem; color: var(--brand-teal);"></i> Optimize
                    </button>
                  </div>
                  <div class="currency-input-wrapper">
                    <span class="currency-prefix">$</span>
                    <input type="text" inputmode="decimal" value="${loan.lumpSum || ""}" placeholder="5000"
                      class="input-field loan-prop-input" data-loan-id="${loan.id}" data-prop="lumpSum">
                  </div>
                </div>

                <div class="input-group">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label class="input-label tooltip-help" title="Additional amount paid towards principal each month.">Extra Monthly ($)</label>
                    <button class="btn btn-secondary btn-sm loan-opt-btn" data-loan-id="${loan.id}" data-mode="monthly" style="padding: 0.15rem 0.5rem; font-size: 0.7rem;">
                      <i data-lucide="sparkles" style="width: 0.75rem; height: 0.75rem; color: var(--brand-teal);"></i> Optimize
                    </button>
                  </div>
                  <div class="currency-input-wrapper">
                    <span class="currency-prefix">$</span>
                    <input type="text" inputmode="decimal" value="${loan.extra || ""}" placeholder="200"
                      class="input-field loan-prop-input" data-loan-id="${loan.id}" data-prop="extra">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer: Actual Payment, Est Payoff, Savings & Modals -->
          <div class="card-footer ${isMin ? "hidden" : ""}" style="${isMin ? "display: none;" : ""}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem;">
              <div style="display: flex; align-items: center; gap: 0.85rem;">
                ${
                  metrics.efficiency > 0
                    ? `
                  <div style="position: relative; width: 2.75rem; height: 2.75rem; border-radius: var(--radius-lg); background: var(--bg-surface-input); border: 1px solid var(--border-subtle); overflow: hidden; display: flex; align-items: center; justify-content: center;"
                    class="tooltip-help" title="Payoff Efficiency: avoided interest ratio.">
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; height: ${metrics.efficiency}%; background: ${effColor}; transition: height 0.6s ease;"></div>
                    <span class="font-mono" style="position: relative; z-index: 1; font-weight: 800; font-size: 0.9rem; color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">${Math.round(metrics.efficiency)}%</span>
                  </div>
                `
                    : ""
                }
                <div>
                  <p class="metric-label text-brand-teal" style="color: var(--brand-teal);">Actual Payment</p>
                  <p class="font-mono gradient-text" style="font-size: 1.85rem; font-weight: 800;">${fmt.format(metrics.actualPayment)}</p>
                </div>
              </div>

              <div style="text-align: right;">
                <p class="metric-label">Est. Payoff</p>
                <p class="font-mono" style="font-size: 1.15rem; font-weight: 800; ${metrics.isPaidOff ? "color: var(--brand-emerald);" : ""}">${metrics.payoffDateString}</p>
                ${
                  metrics.interest_saved > 0
                    ? `
                  <p class="font-mono text-brand-teal" style="font-size: 0.75rem; font-weight: 700; color: var(--brand-teal); margin-top: 0.25rem;">
                    Saved: ${fmt.format(metrics.interest_saved)}
                  </p>
                  <p class="font-mono text-brand-blue" style="font-size: 0.725rem; font-weight: 600; color: var(--brand-blue);">
                    ${Math.floor(metrics.months_saved / 12)}y ${Math.ceil(metrics.months_saved % 12)}mo earlier
                  </p>
                `
                    : ""
                }
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 0.75rem;">
              <button class="btn btn-secondary btn-sm loan-sched-btn" data-loan-id="${loan.id}" style="flex: 1;">
                <i data-lucide="list" style="width: 0.9rem; height: 0.9rem; color: var(--brand-teal);"></i> Schedule
              </button>
              <button class="btn btn-secondary btn-sm loan-chart-btn" data-loan-id="${loan.id}" style="flex: 1; border-color: rgba(99, 102, 241, 0.4); color: var(--brand-purple);">
                <i data-lucide="line-chart" style="width: 0.9rem; height: 0.9rem;"></i> Sweet Spot Curve
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  // Attach Listeners
  container.querySelectorAll(".loan-name-input").forEach((input) => {
    input.oninput = (e) => onUpdateProp(parseInt(e.target.dataset.loanId), "name", e.target.value);
  });

  container.querySelectorAll(".loan-prop-input").forEach((input) => {
    input.oninput = (e) => onUpdateProp(parseInt(e.target.dataset.loanId), e.target.dataset.prop, e.target.value);
  });

  container.querySelectorAll(".loan-min-toggle").forEach((btn) => {
    btn.onclick = (e) => onToggleMinimize("loan", parseInt(e.currentTarget.dataset.loanId));
  });

  container.querySelectorAll(".loan-dup-btn").forEach((btn) => {
    btn.onclick = (e) => onDuplicate(parseInt(e.currentTarget.dataset.loanId));
  });

  container.querySelectorAll(".loan-del-btn").forEach((btn) => {
    btn.onclick = (e) => onDelete(parseInt(e.currentTarget.dataset.loanId));
  });

  container.querySelectorAll(".loan-sched-btn").forEach((btn) => {
    btn.onclick = (e) => onShowAmortization(parseInt(e.currentTarget.dataset.loanId));
  });

  container.querySelectorAll(".loan-chart-btn").forEach((btn) => {
    btn.onclick = (e) => onShowSweetSpot(parseInt(e.currentTarget.dataset.loanId));
  });

  container.querySelectorAll(".loan-opt-btn").forEach((btn) => {
    btn.onclick = (e) =>
      onOptimizeAccelerator(parseInt(e.currentTarget.dataset.loanId), e.currentTarget.dataset.mode);
  });

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
      const loanId = parseInt(e.currentTarget.dataset.loanId);
      const color = e.currentTarget.dataset.color;
      onUpdateColor("loan", loanId, color);
    };
  });

  initSortableContainer("loansContainer", "loan", () => {});
  refreshIcons();
}
