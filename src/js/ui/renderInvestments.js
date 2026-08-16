/**
 * APY Savings Scenarios Tab Renderer (Ultra-responsive, zero-lag in-place typing)
 */

import { fmt, cardColors, refreshIcons, escapeHtml } from "../utils.js";
import { calcInvestmentMetrics } from "../calculations.js";
import { updateStateSilently } from "../state.js";
import { initSortableContainer } from "./dragDrop.js";

export function updateInvestmentCardMetrics(cardEl, inv) {
  if (!cardEl || !inv) return;
  const metrics = calcInvestmentMetrics(inv);
  if (!metrics) return;

  const yieldEl = cardEl.querySelector(".inv-m-yield");
  const fv1El = cardEl.querySelector(".inv-m-fv1");
  const fv2El = cardEl.querySelector(".inv-m-fv2");
  const fv5El = cardEl.querySelector(".inv-m-fv5");
  const fv10El = cardEl.querySelector(".inv-m-fv10");

  if (yieldEl) yieldEl.innerText = fmt.format(metrics.firstMonthYield);
  if (fv1El) fv1El.innerText = fmt.format(metrics.fv1Year);
  if (fv2El) fv2El.innerText = fmt.format(metrics.fv2Years);
  if (fv5El) fv5El.innerText = fmt.format(metrics.fv5Years);
  if (fv10El) fv10El.innerText = fmt.format(metrics.fv10Years);
}

export function renderInvestments(container, state, handlers) {
  if (!container || !state) return;

  const {
    onToggleMinimize,
    onUpdateColor,
    onDuplicate,
    onDelete,
    onShowApyChart,
    onFastUpdate,
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
              <i data-lucide="grip-vertical" class="drag-handle" style="width: 1.15rem; height: 1.15rem;"></i>
              <input type="text" value="${escapeHtml(inv.name)}" data-inv-id="${inv.id}" class="inv-name-input"
                style="font-size: 1.1rem; font-weight: 700; background: transparent; border: none; outline: none; color: var(--text-main); width: 100%;"
                placeholder="Account Name">
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
                        `<button class="color-swatch ${c} ${inv.color === c ? "active" : ""}" data-inv-id="${inv.id}" data-color="${c}"></button>`
                    )
                    .join("")}
                </div>
              </div>

              <button class="icon-btn inv-min-toggle" data-inv-id="${inv.id}" title="${isMin ? "Expand" : "Minimize"}">
                <i data-lucide="${isMin ? "chevron-down" : "chevron-up"}" style="width: 0.95rem; height: 0.95rem;"></i>
              </button>

              <button class="icon-btn inv-dup-btn" data-inv-id="${inv.id}" title="Duplicate Scenario">
                <i data-lucide="copy" style="width: 0.95rem; height: 0.95rem;"></i>
              </button>

              <button class="icon-btn inv-del-btn" data-inv-id="${inv.id}" title="Delete Scenario" style="color: var(--brand-rose);">
                <i data-lucide="trash-2" style="width: 0.95rem; height: 0.95rem;"></i>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="card-body ${isMin ? "hidden" : ""}" style="${isMin ? "display: none;" : ""}">
            <div class="cards-grid cards-grid-2">
              <div class="input-group">
                <label class="input-label tooltip-help" title="Starting initial deposit or account balance.">Initial Principal</label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix">$</span>
                  <input type="text" inputmode="decimal" value="${escapeHtml(inv.principal)}" placeholder="5000"
                    class="input-field inv-prop-input" data-inv-id="${inv.id}" data-prop="principal">
                </div>
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" style="color: var(--brand-blue);" title="Recurring monthly deposit added to principal.">
                  Monthly Deposit ($)
                </label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix" style="color: var(--brand-blue);">$</span>
                  <input type="text" inputmode="decimal" value="${escapeHtml(inv.monthly)}" placeholder="250"
                    class="input-field inv-prop-input" data-inv-id="${inv.id}" data-prop="monthly"
                    style="border-color: rgba(59, 130, 246, 0.4); color: var(--brand-blue); font-weight: 700;">
                </div>
              </div>
            </div>

            <div class="cards-grid cards-grid-2">
              <div class="input-group">
                <label class="input-label tooltip-help" title="Annual Percentage Yield (APY).">Base APY Rate (%)</label>
                <input type="text" inputmode="decimal" value="${escapeHtml(inv.rate)}" placeholder="4.75"
                  class="input-field inv-prop-input" data-inv-id="${inv.id}" data-prop="rate">
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" title="Maximum balance that earns top-tier APY. Leave blank if uncapped.">Balance Tier Cap ($)</label>
                <input type="text" inputmode="decimal" value="${escapeHtml(inv.rateCap)}" placeholder="Uncapped"
                  class="input-field inv-prop-input" data-inv-id="${inv.id}" data-prop="rateCap">
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" title="Rate applied only to balances exceeding the tier cap.">Over-Cap APY (%)</label>
                <input type="text" inputmode="decimal" value="${escapeHtml(inv.rateOverCap)}" placeholder="0.5"
                  class="input-field inv-prop-input" data-inv-id="${inv.id}" data-prop="rateOverCap">
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" title="Marginal tax bracket percentage for after-tax return calculation.">Tax Bracket (%)</label>
                <input type="text" inputmode="decimal" value="${escapeHtml(inv.taxBracket)}" placeholder="22"
                  class="input-field inv-prop-input" data-inv-id="${inv.id}" data-prop="taxBracket">
              </div>
            </div>
          </div>

          <!-- Footer: Yields, 10-Yr Grid, & 30-Year Chart Button -->
          <div class="card-footer ${isMin ? "hidden" : ""}" style="${isMin ? "display: none;" : ""}">
            <div class="metric-box" style="margin-bottom: 0.85rem; border-color: rgba(59, 130, 246, 0.3);">
              <div>
                <span class="metric-label tooltip-help" title="Estimated interest earned in month 1 after tax deduction.">
                  Est. 1st Mo. Yield (Net)
                </span>
              </div>
              <span class="font-mono inv-m-yield" style="font-size: 1.4rem; font-weight: 800; color: var(--brand-blue);">${fmt.format(metrics.firstMonthYield)}</span>
            </div>

            <!-- Future Balance Projections Grid -->
            <div class="cards-grid cards-grid-4" style="gap: 0.4rem; text-align: center; margin-bottom: 0.85rem;">
              <div class="metric-box" style="padding: 0.45rem; flex-direction: column;">
                <p class="metric-label" style="font-size: 0.675rem;">1 Year</p>
                <p class="font-mono inv-m-fv1" style="font-size: 0.825rem; font-weight: 700; margin-top: 0.15rem;">${fmt.format(metrics.fv1Year)}</p>
              </div>
              <div class="metric-box" style="padding: 0.45rem; flex-direction: column;">
                <p class="metric-label" style="font-size: 0.675rem;">2 Years</p>
                <p class="font-mono inv-m-fv2" style="font-size: 0.825rem; font-weight: 700; margin-top: 0.15rem;">${fmt.format(metrics.fv2Years)}</p>
              </div>
              <div class="metric-box" style="padding: 0.45rem; flex-direction: column;">
                <p class="metric-label" style="font-size: 0.675rem;">5 Years</p>
                <p class="font-mono inv-m-fv5" style="font-size: 0.825rem; font-weight: 700; margin-top: 0.15rem;">${fmt.format(metrics.fv5Years)}</p>
              </div>
              <div class="metric-box" style="padding: 0.45rem; flex-direction: column; border-color: rgba(59, 130, 246, 0.35); background: var(--bg-surface-elevated);">
                <p class="metric-label" style="font-size: 0.675rem; color: var(--brand-blue);">10 Years</p>
                <p class="font-mono inv-m-fv10" style="font-size: 0.825rem; font-weight: 800; color: var(--brand-blue); margin-top: 0.15rem;">${fmt.format(metrics.fv10Years)}</p>
              </div>
            </div>

            <button class="btn btn-secondary btn-sm inv-chart-btn" data-inv-id="${inv.id}" style="width: 100%;">
              <i data-lucide="line-chart" style="width: 0.85rem; height: 0.85rem; color: var(--brand-blue);"></i> View 30-Year Compound Growth
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  // Live in-place input listeners
  container.querySelectorAll(".inv-prop-input").forEach((input) => {
    input.oninput = (e) => {
      const invId = parseInt(e.target.dataset.invId);
      const prop = e.target.dataset.prop;
      const inv = state.investments.find((i) => i.id === invId);
      if (inv) {
        inv[prop] = e.target.value;
        const cardEl = document.getElementById(`inv-${invId}`);
        updateInvestmentCardMetrics(cardEl, inv);
        if (typeof onFastUpdate === "function") onFastUpdate();
        updateStateSilently((s) => {
          const item = s.investments.find((x) => x.id === invId);
          if (item) item[prop] = e.target.value;
        });
      }
    };
  });

  container.querySelectorAll(".inv-name-input").forEach((input) => {
    input.oninput = (e) => {
      const invId = parseInt(e.target.dataset.invId);
      const inv = state.investments.find((i) => i.id === invId);
      if (inv) {
        inv.name = e.target.value;
        updateStateSilently((s) => {
          const item = s.investments.find((x) => x.id === invId);
          if (item) item.name = e.target.value;
        });
      }
    };
  });

  // Structural Actions
  container.querySelectorAll(".inv-min-toggle").forEach((btn) => {
    btn.onclick = (e) => onToggleMinimize("interest", parseInt(e.currentTarget.dataset.invId));
  });

  container.querySelectorAll(".inv-dup-btn").forEach((btn) => {
    btn.onclick = (e) => onDuplicate(parseInt(e.currentTarget.dataset.invId));
  });

  container.querySelectorAll(".inv-del-btn").forEach((btn) => {
    btn.onclick = (e) => onDelete(parseInt(e.currentTarget.dataset.invId));
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
      onUpdateColor("interest", parseInt(e.target.dataset.invId), e.target.dataset.color);
    };
  });

  container.querySelectorAll(".inv-chart-btn").forEach((btn) => {
    btn.onclick = (e) => onShowApyChart(parseInt(e.currentTarget.dataset.invId));
  });

  initSortableContainer(container, "interest", handlers.onReorder);
  refreshIcons();
}
