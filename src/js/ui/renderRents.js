/**
 * Rent Scenarios Tab Renderer
 */

import { fmt, cardColors, refreshIcons, escapeHtml } from "../utils.js";
import { calcRentMetrics } from "../calculations.js";
import { initSortableContainer } from "./dragDrop.js";

export function renderRents(container, state, handlers) {
  if (!container || !state) return;

  const {
    onUpdateProp,
    onToggleMinimize,
    onUpdateColor,
    onDuplicate,
    onDelete,
  } = handlers;

  container.innerHTML = state.rents
    .map((rent) => {
      const metrics = calcRentMetrics(rent);
      const isMin = !!rent.isMinimized;

      return `
        <div id="rent-${rent.id}" class="glass-card flex flex-col h-full">
          <div class="card-flair-bar ${rent.color || "bg-teal-500"}"></div>

          <!-- Header -->
          <div class="card-header">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0;">
              <i data-lucide="grip-vertical" class="drag-handle" style="width: 1.15rem; height: 1.15rem;"></i>
              <input type="text" value="${escapeHtml(rent.name)}" data-rent-id="${rent.id}" class="rent-name-input"
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
                        `<button class="color-swatch ${c} ${rent.color === c ? "active" : ""}" data-rent-id="${rent.id}" data-color="${c}"></button>`
                    )
                    .join("")}
                </div>
              </div>

              <button class="icon-btn rent-min-toggle" data-rent-id="${rent.id}" title="${isMin ? "Expand" : "Minimize"}">
                <i data-lucide="${isMin ? "chevron-down" : "chevron-up"}" style="width: 0.95rem; height: 0.95rem;"></i>
              </button>

              <button class="icon-btn rent-dup-btn" data-rent-id="${rent.id}" title="Duplicate Scenario">
                <i data-lucide="copy" style="width: 0.95rem; height: 0.95rem;"></i>
              </button>

              <button class="icon-btn rent-del-btn" data-rent-id="${rent.id}" title="Delete Scenario" style="color: var(--brand-rose);">
                <i data-lucide="trash-2" style="width: 0.95rem; height: 0.95rem;"></i>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="card-body ${isMin ? "hidden" : ""}" style="${isMin ? "display: none;" : ""}">
            <div class="input-group">
              <label class="input-label tooltip-help" title="Base monthly rental lease payment without utilities.">Base Rent ($/mo)</label>
              <div class="currency-input-wrapper">
                <span class="currency-prefix">$</span>
                <input type="text" inputmode="decimal" value="${escapeHtml(rent.baseRent)}" placeholder="1500"
                  class="input-field rent-prop-input" data-rent-id="${rent.id}" data-prop="baseRent">
              </div>
            </div>

            <div class="cards-grid cards-grid-2">
              <div class="input-group">
                <label class="input-label tooltip-help" title="Estimated monthly water, sewer, and trash.">Water / Sewer ($)</label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix">$</span>
                  <input type="text" inputmode="decimal" value="${escapeHtml(rent.water)}" placeholder="50"
                    class="input-field rent-prop-input" data-rent-id="${rent.id}" data-prop="water">
                </div>
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" title="Estimated electric & gas utility cost.">Electricity ($)</label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix">$</span>
                  <input type="text" inputmode="decimal" value="${escapeHtml(rent.electricity)}" placeholder="100"
                    class="input-field rent-prop-input" data-rent-id="${rent.id}" data-prop="electricity">
                </div>
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" title="High-speed internet / Wi-Fi bill.">Internet ($)</label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix">$</span>
                  <input type="text" inputmode="decimal" value="${escapeHtml(rent.internet)}" placeholder="75"
                    class="input-field rent-prop-input" data-rent-id="${rent.id}" data-prop="internet">
                </div>
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" title="Parking, pet fees, or renters insurance.">Other Fees ($)</label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix">$</span>
                  <input type="text" inputmode="decimal" value="${escapeHtml(rent.other)}" placeholder="30"
                    class="input-field rent-prop-input" data-rent-id="${rent.id}" data-prop="other">
                </div>
              </div>
            </div>
          </div>

          <!-- Footer: Totals -->
          <div class="card-footer ${isMin ? "hidden" : ""}" style="${isMin ? "display: none;" : ""}">
            <div class="metric-box" style="margin-bottom: 0.75rem; border-color: rgba(14, 165, 233, 0.3);">
              <div>
                <span class="metric-label tooltip-help" title="Total estimated monthly housing cost including all utilities.">Total Monthly Cost</span>
              </div>
              <span class="font-mono" style="font-size: 1.45rem; font-weight: 800; color: var(--brand-teal);">${fmt.format(metrics.totalMonthly)}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 0.65rem;">
              <span class="metric-label tooltip-help" title="Total expenditure for 1 full year (12 months).">Estimated Annual Cost</span>
              <span class="font-mono" style="font-size: 1rem; font-weight: 700; color: var(--text-main);">${fmt.format(metrics.totalYearly)}</span>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  // Attach Event Listeners
  container.querySelectorAll(".rent-name-input").forEach((input) => {
    input.oninput = (e) => onUpdateProp(parseInt(e.target.dataset.rentId), "name", e.target.value);
  });

  container.querySelectorAll(".rent-prop-input").forEach((input) => {
    input.oninput = (e) => onUpdateProp(parseInt(e.target.dataset.rentId), e.target.dataset.prop, e.target.value);
  });

  container.querySelectorAll(".rent-min-toggle").forEach((btn) => {
    btn.onclick = (e) => onToggleMinimize("rent", parseInt(e.currentTarget.dataset.rentId));
  });

  container.querySelectorAll(".rent-dup-btn").forEach((btn) => {
    btn.onclick = (e) => onDuplicate(parseInt(e.currentTarget.dataset.rentId));
  });

  container.querySelectorAll(".rent-del-btn").forEach((btn) => {
    btn.onclick = (e) => onDelete(parseInt(e.currentTarget.dataset.rentId));
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
      onUpdateColor("rent", parseInt(e.target.dataset.rentId), e.target.dataset.color);
    };
  });

  initSortableContainer(container, "rent", handlers.onReorder);
  refreshIcons();
}
