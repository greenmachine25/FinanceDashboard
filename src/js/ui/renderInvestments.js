/**
 * APY Savings Scenarios Tab Renderer
 */

import { fmt, cardColors, refreshIcons } from "../utils.js";
import { calcInvestmentMetrics } from "../calculations.js";
import { initSortableContainer } from "./dragDrop.js";

export function renderInvestments(container, state, handlers) {
  if (!container || !state) return;

  const {
    onUpdateProp,
    onToggleMinimize,
    onUpdateColor,
    onDuplicate,
    onDelete,
    onShowApyChart,
  } = handlers;

  container.innerHTML = state.investments
    .map((inv) => {
      const metrics = calcInvestmentMetrics(inv);
      const isMin = !!inv.isMinimized;

      return `
        <div id="inv-${inv.id}" class="glass-card flex flex-col h-full">
          <div class="card-flair-bar ${inv.color || "bg-blue-500"}"></div>

          <!-- Header -->
          <div class="card-header">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0;">
              <i data-lucide="grip-vertical" class="drag-handle" style="width: 1.25rem; height: 1.25rem;"></i>
              <input type="text" value="${inv.name}" data-inv-id="${inv.id}" class="inv-name-input"
                style="font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; background: transparent; border: none; outline: none; color: var(--text-main); width: 100%;"
                placeholder="Account Name">
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
                        `<button class="color-swatch ${c} ${inv.color === c ? "active" : ""}" data-inv-id="${inv.id}" data-color="${c}"></button>`
                    )
                    .join("")}
                </div>
              </div>

              <button class="icon-btn inv-min-toggle" data-inv-id="${inv.id}" title="${isMin ? "Expand" : "Minimize"}">
                <i data-lucide="${isMin ? "chevron-down" : "chevron-up"}" style="width: 1rem; height: 1rem;"></i>
              </button>

              <button class="icon-btn inv-dup-btn" data-inv-id="${inv.id}" title="Duplicate Scenario">
                <i data-lucide="copy" style="width: 1rem; height: 1rem;"></i>
              </button>

              <button class="icon-btn inv-del-btn" data-inv-id="${inv.id}" title="Delete Scenario" style="color: var(--brand-rose);">
                <i data-lucide="trash-2" style="width: 1rem; height: 1rem;"></i>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="card-body ${isMin ? "hidden" : ""}" style="${isMin ? "display: none;" : ""}">
            <div class="cards-grid cards-grid-2">
              <div class="input-group">
                <label class="input-label tooltip-help" title="Initial deposit or current account balance.">Starting Balance ($)</label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix">$</span>
                  <input type="text" inputmode="decimal" value="${inv.principal || ""}" placeholder="5000"
                    class="input-field inv-prop-input" data-inv-id="${inv.id}" data-prop="principal">
                </div>
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help text-brand-blue" style="color: var(--brand-blue);" title="Extra monthly deposit.">
                  Monthly Contrib. ($)
                </label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix" style="color: var(--brand-blue);">$</span>
                  <input type="text" inputmode="decimal" value="${inv.monthly || ""}" placeholder="250"
                    class="input-field inv-prop-input" data-inv-id="${inv.id}" data-prop="monthly"
                    style="border-color: rgba(59, 130, 246, 0.4); color: var(--brand-blue); font-weight: 700;">
                </div>
              </div>
            </div>

            <div class="cards-grid cards-grid-2">
              <div class="input-group">
                <label class="input-label tooltip-help" title="Annual Percentage Yield before taxes.">Base APY Rate (%)</label>
                <input type="text" inputmode="decimal" value="${inv.rate || ""}" placeholder="4.5"
                  class="input-field inv-prop-input" data-inv-id="${inv.id}" data-prop="rate">
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" title="Tier cap for highest APY rate. Blank if none.">APY Balance Cap ($)</label>
                <input type="text" inputmode="decimal" value="${inv.rateCap || ""}" placeholder="Blank if none"
                  class="input-field inv-prop-input" data-inv-id="${inv.id}" data-prop="rateCap">
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" title="APY rate applied to balances above the cap.">Over-Cap APY (%)</label>
                <input type="text" inputmode="decimal" value="${inv.rateOverCap || ""}" placeholder="0.5"
                  class="input-field inv-prop-input" data-inv-id="${inv.id}" data-prop="rateOverCap">
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" title="Your income tax bracket rate. Interest is taxable.">Tax Bracket (%)</label>
                <input type="text" inputmode="decimal" value="${inv.taxBracket || ""}" placeholder="22"
                  class="input-field inv-prop-input" data-inv-id="${inv.id}" data-prop="taxBracket">
              </div>
            </div>
          </div>

          <!-- Footer: Yields, 10-Yr Grid, & 30-Year Chart Button -->
          <div class="card-footer ${isMin ? "hidden" : ""}" style="${isMin ? "display: none;" : ""}">
            <div class="metric-box" style="margin-bottom: 1rem; border-color: rgba(59, 130, 246, 0.3);">
              <div>
                <span class="metric-label tooltip-help" title="Estimated interest earned in month 1 after tax deduction.">
                  After-Tax 1st Mo. Yield
                </span>
              </div>
              <span class="font-mono" style="font-size: 1.6rem; font-weight: 800; color: var(--brand-blue);">${fmt.format(metrics.firstMonthYield)}</span>
            </div>

            <!-- Future Balance Projections Grid -->
            <div class="cards-grid cards-grid-4" style="gap: 0.5rem; text-align: center; margin-bottom: 1rem;">
              <div class="metric-box" style="padding: 0.5rem; flex-direction: column;">
                <p class="metric-label">1 Year</p>
                <p class="font-mono" style="font-size: 0.875rem; font-weight: 700; margin-top: 0.25rem;">${fmt.format(metrics.fv1Year)}</p>
              </div>
              <div class="metric-box" style="padding: 0.5rem; flex-direction: column;">
                <p class="metric-label">2 Years</p>
                <p class="font-mono" style="font-size: 0.875rem; font-weight: 700; margin-top: 0.25rem;">${fmt.format(metrics.fv2Years)}</p>
              </div>
              <div class="metric-box" style="padding: 0.5rem; flex-direction: column;">
                <p class="metric-label">5 Years</p>
                <p class="font-mono" style="font-size: 0.875rem; font-weight: 700; margin-top: 0.25rem;">${fmt.format(metrics.fv5Years)}</p>
              </div>
              <div class="metric-box" style="padding: 0.5rem; flex-direction: column; background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.25);">
                <p class="metric-label" style="color: var(--brand-blue);">10 Years</p>
                <p class="font-mono" style="font-size: 0.875rem; font-weight: 800; color: var(--brand-blue); margin-top: 0.25rem;">${fmt.format(metrics.fv10Years)}</p>
              </div>
            </div>

            <button class="btn btn-secondary btn-sm inv-chart-btn" data-inv-id="${inv.id}" style="width: 100%; border-color: rgba(59, 130, 246, 0.3); color: var(--brand-blue);">
              <i data-lucide="line-chart" style="width: 0.9rem; height: 0.9rem;"></i> View 30-Year Graph
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  // Attach Listeners
  container.querySelectorAll(".inv-name-input").forEach((input) => {
    input.oninput = (e) => onUpdateProp(parseInt(e.target.dataset.invId), "name", e.target.value);
  });

  container.querySelectorAll(".inv-prop-input").forEach((input) => {
    input.oninput = (e) => onUpdateProp(parseInt(e.target.dataset.invId), e.target.dataset.prop, e.target.value);
  });

  container.querySelectorAll(".inv-min-toggle").forEach((btn) => {
    btn.onclick = (e) => onToggleMinimize("interest", parseInt(e.currentTarget.dataset.invId));
  });

  container.querySelectorAll(".inv-dup-btn").forEach((btn) => {
    btn.onclick = (e) => onDuplicate(parseInt(e.currentTarget.dataset.invId));
  });

  container.querySelectorAll(".inv-del-btn").forEach((btn) => {
    btn.onclick = (e) => onDelete(parseInt(e.currentTarget.dataset.invId));
  });

  container.querySelectorAll(".inv-chart-btn").forEach((btn) => {
    btn.onclick = (e) => onShowApyChart(parseInt(e.currentTarget.dataset.invId));
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
      const invId = parseInt(e.currentTarget.dataset.invId);
      const color = e.currentTarget.dataset.color;
      onUpdateColor("interest", invId, color);
    };
  });

  initSortableContainer("interestContainer", "interest", () => {});
  refreshIcons();
}
