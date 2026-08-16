/**
 * Rent Scenarios Tab Renderer (Ultra-responsive, zero-lag in-place typing)
 */

import { fmt, cardColors, refreshIcons, escapeHtml } from "../utils.js";
import { calcRentMetrics } from "../calculations.js";
import { updateStateSilently } from "../state.js";
import { initSortableContainer } from "./dragDrop.js";

export function updateRentCardMetrics(cardEl, rent) {
  if (!cardEl || !rent) return;
  const metrics = calcRentMetrics(rent);
  if (!metrics) return;

  const monthlyEl = cardEl.querySelector(".rent-m-monthly");
  const yearlyEl = cardEl.querySelector(".rent-m-yearly");

  if (monthlyEl) monthlyEl.innerText = fmt.format(metrics.totalMonthly);
  if (yearlyEl) yearlyEl.innerText = fmt.format(metrics.totalYearly);
}

export function renderRents(container, state, handlers) {
  if (!container || !state) return;

  const {
    onToggleMinimize,
    onUpdateColor,
    onDuplicate,
    onDelete,
    onFastUpdate,
  } = handlers;

  if (state.rents.length === 0) {
    container.innerHTML = `
      <div class="glass-card" style="grid-column: 1 / -1; padding: 3.5rem 1.5rem; text-align: center;">
        <i data-lucide="home" style="width: 2.5rem; height: 2.5rem; margin: 0 auto 0.75rem; color: var(--brand-emerald);"></i>
        <p style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem;">
          No Rent Scenarios Created Yet
        </p>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem; max-width: 28rem; margin-left: auto; margin-right: auto;">
          Compare apartment options by tallying base lease prices with estimated electric, water, trash, and parking fees.
        </p>
        <button id="emptyAddRentBtn" class="btn btn-primary" style="margin: 0 auto;">
          <i data-lucide="plus" style="width: 1rem; height: 1rem;"></i> Create First Rent Scenario
        </button>
      </div>
    `;
    container.querySelector("#emptyAddRentBtn")?.addEventListener("click", () => {
      document.getElementById("addRentBtn")?.click();
    });
    refreshIcons();
    return;
  }

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
              <span class="font-mono rent-m-monthly" style="font-size: 1.45rem; font-weight: 800; color: var(--brand-teal);">${fmt.format(metrics.totalMonthly)}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 0.65rem;">
              <span class="metric-label tooltip-help" title="Total expenditure for 1 full year (12 months).">Estimated Annual Cost</span>
              <span class="font-mono rent-m-yearly" style="font-size: 1rem; font-weight: 700; color: var(--text-main);">${fmt.format(metrics.totalYearly)}</span>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  // Live in-place input listeners
  container.querySelectorAll(".rent-prop-input").forEach((input) => {
    input.oninput = (e) => {
      const rentId = parseInt(e.target.dataset.rentId);
      const prop = e.target.dataset.prop;
      const rent = state.rents.find((r) => r.id === rentId);
      if (rent) {
        rent[prop] = e.target.value;
        const cardEl = document.getElementById(`rent-${rentId}`);
        updateRentCardMetrics(cardEl, rent);
        if (typeof onFastUpdate === "function") onFastUpdate();
        updateStateSilently((s) => {
          const item = s.rents.find((x) => x.id === rentId);
          if (item) item[prop] = e.target.value;
        });
      }
    };
  });

  container.querySelectorAll(".rent-name-input").forEach((input) => {
    input.oninput = (e) => {
      const rentId = parseInt(e.target.dataset.rentId);
      const rent = state.rents.find((r) => r.id === rentId);
      if (rent) {
        rent.name = e.target.value;
        updateStateSilently((s) => {
          const item = s.rents.find((x) => x.id === rentId);
          if (item) item.name = e.target.value;
        });
      }
    };
  });

  // Structural Actions
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
