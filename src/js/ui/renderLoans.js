/**
 * Loan Scenarios Tab Renderer
 */

import { fmt, cardColors, refreshIcons, escapeHtml } from "../utils.js";
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
              <i data-lucide="grip-vertical" class="drag-handle" style="width: 1.15rem; height: 1.15rem;"></i>
              <input type="text" value="${escapeHtml(loan.name)}" data-loan-id="${loan.id}" class="loan-name-input"
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
                        `<button class="color-swatch ${c} ${loan.color === c ? "active" : ""}" data-loan-id="${loan.id}" data-color="${c}"></button>`
                    )
                    .join("")}
                </div>
              </div>

              <button class="icon-btn loan-min-toggle" data-loan-id="${loan.id}" title="${isMin ? "Expand" : "Minimize"}">
                <i data-lucide="${isMin ? "chevron-down" : "chevron-up"}" style="width: 0.95rem; height: 0.95rem;"></i>
              </button>

              <button class="icon-btn loan-dup-btn" data-loan-id="${loan.id}" title="Duplicate Scenario">
                <i data-lucide="copy" style="width: 0.95rem; height: 0.95rem;"></i>
              </button>

              <button class="icon-btn loan-del-btn" data-loan-id="${loan.id}" title="Delete Scenario" style="color: var(--brand-rose);">
                <i data-lucide="trash-2" style="width: 0.95rem; height: 0.95rem;"></i>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="card-body ${isMin ? "hidden" : ""}" style="${isMin ? "display: none;" : ""}">
            <!-- Inputs -->
            <div class="cards-grid cards-grid-3" style="gap: 0.65rem;">
              <div class="input-group">
                <label class="input-label tooltip-help" title="Starting loan principal amount.">Orig. Balance</label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix">$</span>
                  <input type="text" inputmode="decimal" value="${escapeHtml(loan.origAmount)}" placeholder="30000"
                    class="input-field loan-prop-input" data-loan-id="${loan.id}" data-prop="origAmount">
                </div>
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" title="Current outstanding balance today.">Current Balance</label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix">$</span>
                  <input type="text" inputmode="decimal" value="${escapeHtml(loan.amount)}" placeholder="22000"
                    class="input-field loan-prop-input" data-loan-id="${loan.id}" data-prop="amount">
                </div>
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" title="Annual Percentage Rate (APR).">Rate (%)</label>
                <input type="text" inputmode="decimal" value="${escapeHtml(loan.rate)}" placeholder="5.5"
                  class="input-field loan-prop-input" data-loan-id="${loan.id}" data-prop="rate">
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" title="Original loan duration in years.">Term (Years)</label>
                <input type="text" inputmode="decimal" value="${escapeHtml(loan.years)}" placeholder="5"
                  class="input-field loan-prop-input" data-loan-id="${loan.id}" data-prop="years">
              </div>

              <div class="input-group" style="grid-column: span 2;">
                <label class="input-label tooltip-help" style="color: var(--brand-teal);" title="Overrides standard amortization monthly base payment.">
                  Manual Base Payment ($)
                </label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix" style="color: var(--brand-teal);">$</span>
                  <input type="text" inputmode="decimal" value="${escapeHtml(loan.minPaymentOverride)}" placeholder="Auto-Calculated"
                    class="input-field loan-prop-input" data-loan-id="${loan.id}" data-prop="minPaymentOverride"
                    style="border-color: rgba(14, 165, 233, 0.4); color: var(--brand-teal); font-weight: 700;">
                </div>
              </div>
            </div>

            <!-- Standard Metrics -->
            <div class="metric-box" style="border-color: rgba(59, 130, 246, 0.3);">
              <div>
                <p class="metric-label" style="color: var(--brand-blue);">Standard Payment</p>
                <p class="font-mono" style="font-size: 1.35rem; font-weight: 800; color: var(--brand-blue);">${fmt.format(metrics.base_payment)}/mo</p>
              </div>
              <div style="text-align: right;">
                <p class="metric-label" style="color: var(--brand-rose);">Remaining Interest</p>
                <p class="font-mono" style="font-size: 1.25rem; font-weight: 800; color: var(--brand-rose);">${fmt.format(metrics.base_interest)}</p>
              </div>
            </div>

            <!-- Initial Payment Breakdown Bar -->
            <div style="background: var(--bg-surface-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 0.75rem 0.9rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.35rem;">
                <span style="color: var(--brand-rose);">Interest: ${fmt.format(metrics.first_mo_int)}</span>
                <span style="color: var(--brand-teal);">Principal: ${fmt.format(metrics.first_mo_prin)}</span>
              </div>
              <div class="progress-track" style="height: 0.5rem;">
                <div class="progress-fill" style="background: var(--brand-rose); width: ${metrics.int_pct}%;"></div>
              </div>
            </div>

            <!-- Payoff Accelerator -->
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 0.85rem;">
              <h4 class="input-label" style="color: var(--brand-teal); margin-bottom: 0.65rem;">
                <i data-lucide="zap" style="width: 0.85rem; height: 0.85rem;"></i> Payoff Accelerators
              </h4>
              <div class="cards-grid cards-grid-2">
                <div class="input-group">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label class="input-label tooltip-help" title="One-time lump sum principal paydown today.">Lump Sum ($)</label>
                    <button class="btn btn-secondary btn-sm loan-opt-btn" data-loan-id="${loan.id}" data-mode="lump" style="padding: 0.15rem 0.45rem; font-size: 0.7rem;">
                      <i data-lucide="sparkles" style="width: 0.7rem; height: 0.7rem; color: var(--brand-teal);"></i> Optimize
                    </button>
                  </div>
                  <div class="currency-input-wrapper">
                    <span class="currency-prefix">$</span>
                    <input type="text" inputmode="decimal" value="${escapeHtml(loan.lumpSum)}" placeholder="0"
                      class="input-field loan-prop-input" data-loan-id="${loan.id}" data-prop="lumpSum">
                  </div>
                </div>

                <div class="input-group">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label class="input-label tooltip-help" title="Additional monthly principal reduction.">Extra Monthly ($)</label>
                    <button class="btn btn-secondary btn-sm loan-opt-btn" data-loan-id="${loan.id}" data-mode="monthly" style="padding: 0.15rem 0.45rem; font-size: 0.7rem;">
                      <i data-lucide="sparkles" style="width: 0.7rem; height: 0.7rem; color: var(--brand-teal);"></i> Optimize
                    </button>
                  </div>
                  <div class="currency-input-wrapper">
                    <span class="currency-prefix">$</span>
                    <input type="text" inputmode="decimal" value="${escapeHtml(loan.extra)}" placeholder="0"
                      class="input-field loan-prop-input" data-loan-id="${loan.id}" data-prop="extra">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer: Actual Payment, Est Payoff, Savings & Modals -->
          <div class="card-footer ${isMin ? "hidden" : ""}" style="${isMin ? "display: none;" : ""}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                ${
                  metrics.efficiency > 0
                    ? `
                  <div style="position: relative; width: 2.6rem; height: 2.6rem; border-radius: var(--radius-md); background: var(--bg-surface-input); border: 1px solid var(--border-subtle); overflow: hidden; display: flex; align-items: center; justify-content: center;"
                    class="tooltip-help" title="Payoff Efficiency Score: avoided interest proportion.">
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; height: ${metrics.efficiency}%; background: ${effColor}; transition: height 0.5s ease;"></div>
                    <span class="font-mono" style="position: relative; z-index: 1; font-weight: 800; font-size: 0.85rem; color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">${Math.round(metrics.efficiency)}%</span>
                  </div>
                `
                    : ""
                }
                <div>
                  <p class="metric-label">Effective Payment</p>
                  <p class="font-mono" style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">${fmt.format(metrics.actualPayment)}/mo</p>
                </div>
              </div>

              <div style="text-align: right;">
                <p class="metric-label">Estimated Payoff</p>
                <p class="font-mono" style="font-size: 1.05rem; font-weight: 700; color: var(--brand-teal);">${metrics.payoffDateString}</p>
                ${
                  metrics.months_saved > 0
                    ? `<span style="font-size: 0.725rem; color: var(--brand-emerald); font-weight: 700;">Saved ${(metrics.months_saved / 12).toFixed(1)} yrs & ${fmt.format(metrics.interest_saved)}</span>`
                    : ""
                }
              </div>
            </div>

            <!-- Modal Action Buttons -->
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-secondary btn-sm loan-amort-btn" data-loan-id="${loan.id}" style="flex: 1;">
                <i data-lucide="calendar" style="width: 0.85rem; height: 0.85rem;"></i> Amortization
              </button>
              <button class="btn btn-secondary btn-sm loan-sweetspot-btn" data-loan-id="${loan.id}" style="flex: 1;">
                <i data-lucide="line-chart" style="width: 0.85rem; height: 0.85rem; color: var(--brand-purple);"></i> Sweet Spot Curve
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  // Attach Event Listeners
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

  container.querySelectorAll(".color-picker-toggle").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const menu = btn.nextElementSibling;
      menu.classList.toggle("hidden");
    };
  });

  container.querySelectorAll(".color-swatch").forEach((swatch) => {
    swatch.onclick = (e) => {
      onUpdateColor("loan", parseInt(e.target.dataset.loanId), e.target.dataset.color);
    };
  });

  container.querySelectorAll(".loan-amort-btn").forEach((btn) => {
    btn.onclick = (e) => onShowAmortization(parseInt(e.currentTarget.dataset.loanId));
  });

  container.querySelectorAll(".loan-sweetspot-btn").forEach((btn) => {
    btn.onclick = (e) => onShowSweetSpot(parseInt(e.currentTarget.dataset.loanId));
  });

  container.querySelectorAll(".loan-opt-btn").forEach((btn) => {
    btn.onclick = (e) => onOptimizeAccelerator(parseInt(e.currentTarget.dataset.loanId), e.currentTarget.dataset.mode);
  });

  initSortableContainer(container, "loan", handlers.onReorder);
  refreshIcons();
}
