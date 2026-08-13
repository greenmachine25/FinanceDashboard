/**
 * Rent Scenarios Tab Renderer
 */

import { fmt, cardColors, refreshIcons } from "../utils.js";
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
              <i data-lucide="grip-vertical" class="drag-handle" style="width: 1.25rem; height: 1.25rem;"></i>
              <input type="text" value="${rent.name}" data-rent-id="${rent.id}" class="rent-name-input"
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
                        `<button class="color-swatch ${c} ${rent.color === c ? "active" : ""}" data-rent-id="${rent.id}" data-color="${c}"></button>`
                    )
                    .join("")}
                </div>
              </div>

              <button class="icon-btn rent-min-toggle" data-rent-id="${rent.id}" title="${isMin ? "Expand" : "Minimize"}">
                <i data-lucide="${isMin ? "chevron-down" : "chevron-up"}" style="width: 1rem; height: 1rem;"></i>
              </button>

              <button class="icon-btn rent-dup-btn" data-rent-id="${rent.id}" title="Duplicate Scenario">
                <i data-lucide="copy" style="width: 1rem; height: 1rem;"></i>
              </button>

              <button class="icon-btn rent-del-btn" data-rent-id="${rent.id}" title="Delete Scenario" style="color: var(--brand-rose);">
                <i data-lucide="trash-2" style="width: 1rem; height: 1rem;"></i>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="card-body ${isMin ? "hidden" : ""}" style="${isMin ? "display: none;" : ""}">
            <div class="input-group">
              <label class="input-label tooltip-help" title="Monthly base rent amount without utilities.">Base Rent ($/mo)</label>
              <div class="currency-input-wrapper">
                <span class="currency-prefix">$</span>
                <input type="text" inputmode="decimal" value="${rent.baseRent || ""}" placeholder="1500"
                  class="input-field rent-prop-input" data-rent-id="${rent.id}" data-prop="baseRent">
              </div>
            </div>

            <div class="cards-grid cards-grid-2">
              <div class="input-group">
                <label class="input-label tooltip-help" title="Estimated monthly water/sewer/trash bill.">Water/Sewer ($/mo)</label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix">$</span>
                  <input type="text" inputmode="decimal" value="${rent.water || ""}" placeholder="50"
                    class="input-field rent-prop-input" data-rent-id="${rent.id}" data-prop="water">
                </div>
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" title="Estimated monthly electricity/gas bill.">Electricity ($/mo)</label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix">$</span>
                  <input type="text" inputmode="decimal" value="${rent.electricity || ""}" placeholder="100"
                    class="input-field rent-prop-input" data-rent-id="${rent.id}" data-prop="electricity">
                </div>
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" title="Estimated monthly internet/cable bill.">Internet ($/mo)</label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix">$</span>
                  <input type="text" inputmode="decimal" value="${rent.internet || ""}" placeholder="80"
                    class="input-field rent-prop-input" data-rent-id="${rent.id}" data-prop="internet">
                </div>
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" title="Any other monthly fees like parking or renter's insurance.">Other Fees ($/mo)</label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix">$</span>
                  <input type="text" inputmode="decimal" value="${rent.other || ""}" placeholder="25"
                    class="input-field rent-prop-input" data-rent-id="${rent.id}" data-prop="other">
                </div>
              </div>
            </div>
          </div>

          <!-- Footer: Totals -->
          <div class="card-footer ${isMin ? "hidden" : ""}" style="${isMin ? "display: none;" : ""}">
            <div class="metric-box" style="margin-bottom: 1rem; border-color: rgba(14, 165, 233, 0.3);">
              <div>
                <span class="metric-label tooltip-help" title="Total estimated monthly cost including all utilities.">Total Monthly Cost</span>
              </div>
              <span class="font-mono" style="font-size: 1.6rem; font-weight: 800; color: var(--brand-teal);">${fmt.format(metrics.totalMonthly)}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
              <span class="metric-label tooltip-help" title="Total amount you will spend living here for 1 full year.">Estimated Yearly Total</span>
              <span class="font-mono" style="font-size: 1.05rem; font-weight: 700; color: var(--text-main);">${fmt.format(metrics.totalYearly)}</span>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  // Attach Listeners
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
      const menu = e.currentTarget.nextElementSibling;
      document.querySelectorAll(".color-palette-menu").forEach((m) => {
        if (m !== menu) m.classList.add("hidden");
      });
      menu.classList.toggle("hidden");
    };
  });

  container.querySelectorAll(".color-swatch").forEach((btn) => {
    btn.onclick = (e) => {
      const rentId = parseInt(e.currentTarget.dataset.rentId);
      const color = e.currentTarget.dataset.color;
      onUpdateColor("rent", rentId, color);
    };
  });

  initSortableContainer("rentsContainer", "rent", () => {});
  refreshIcons();
}
