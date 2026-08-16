/**
 * Goals (Sinking Funds) Tab Renderer (Ultra-responsive, zero-lag in-place typing)
 */

import { cardColors, refreshIcons, escapeHtml } from "../utils.js";
import { calcGoalMetrics } from "../calculations.js";
import { updateStateSilently } from "../state.js";
import { initSortableContainer } from "./dragDrop.js";

export function updateGoalCardMetrics(cardEl, goal) {
  if (!cardEl || !goal) return;
  const metrics = calcGoalMetrics(goal);
  if (!metrics) return;

  const pctEl = cardEl.querySelector(".goal-m-pct");
  const barEl = cardEl.querySelector(".goal-m-bar");
  const timeEl = cardEl.querySelector(".goal-m-time");
  const dateEl = cardEl.querySelector(".goal-m-date");

  if (pctEl) pctEl.innerText = `${Math.round(metrics.progressPct)}%`;
  if (barEl) barEl.style.width = `${metrics.progressPct}%`;
  if (timeEl) {
    timeEl.innerText = metrics.timeRemainingText;
    if (metrics.isCompleted) {
      timeEl.classList.add("text-brand-emerald");
    } else {
      timeEl.classList.remove("text-brand-emerald");
    }
  }
  if (dateEl) {
    dateEl.innerText = metrics.targetDateString;
    dateEl.style.display = metrics.targetDateString ? "block" : "none";
  }
}

export function renderGoals(container, state, handlers) {
  if (!container || !state) return;

  const {
    onUpdateProp,
    onToggleMinimize,
    onUpdateColor,
    onDuplicate,
    onDelete,
    onFastUpdate,
  } = handlers;

  container.innerHTML = state.goals
    .map((goal) => {
      const metrics = calcGoalMetrics(goal);
      const isMin = !!goal.isMinimized;

      return `
        <div id="goal-${goal.id}" class="glass-card flex flex-col h-full">
          <div class="card-flair-bar ${goal.color || "bg-fuchsia-500"}"></div>

          <!-- Header -->
          <div class="card-header">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0;">
              <i data-lucide="grip-vertical" class="drag-handle" style="width: 1.15rem; height: 1.15rem;"></i>
              <input type="text" value="${escapeHtml(goal.name)}" data-goal-id="${goal.id}" class="goal-name-input"
                style="font-size: 1.1rem; font-weight: 700; background: transparent; border: none; outline: none; color: var(--text-main); width: 100%;"
                placeholder="Goal Name (e.g. Travel / Car)">
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
                        `<button class="color-swatch ${c} ${goal.color === c ? "active" : ""}" data-goal-id="${goal.id}" data-color="${c}"></button>`
                    )
                    .join("")}
                </div>
              </div>

              <button class="icon-btn goal-min-toggle" data-goal-id="${goal.id}" title="${isMin ? "Expand" : "Minimize"}">
                <i data-lucide="${isMin ? "chevron-down" : "chevron-up"}" style="width: 0.95rem; height: 0.95rem;"></i>
              </button>

              <button class="icon-btn goal-dup-btn" data-goal-id="${goal.id}" title="Duplicate Goal">
                <i data-lucide="copy" style="width: 0.95rem; height: 0.95rem;"></i>
              </button>

              <button class="icon-btn goal-del-btn" data-goal-id="${goal.id}" title="Delete Goal" style="color: var(--brand-rose);">
                <i data-lucide="trash-2" style="width: 0.95rem; height: 0.95rem;"></i>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="card-body ${isMin ? "hidden" : ""}" style="${isMin ? "display: none;" : ""}">
            <div class="cards-grid cards-grid-2">
              <div class="input-group">
                <label class="input-label tooltip-help" title="Total funding needed to complete this sinking fund.">Target Amount ($)</label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix">$</span>
                  <input type="text" inputmode="decimal" value="${escapeHtml(goal.targetAmount)}" placeholder="5000"
                    class="input-field goal-prop-input" data-goal-id="${goal.id}" data-prop="targetAmount">
                </div>
              </div>

              <div class="input-group">
                <label class="input-label tooltip-help" title="How much money has already been saved.">Currently Saved ($)</label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix">$</span>
                  <input type="text" inputmode="decimal" value="${escapeHtml(goal.savedAmount)}" placeholder="1200"
                    class="input-field goal-prop-input" data-goal-id="${goal.id}" data-prop="savedAmount">
                </div>
              </div>
            </div>

            <div class="input-group">
              <label class="input-label tooltip-help" style="color: var(--brand-fuchsia);" title="Dedicated amount deposited every month towards this goal.">
                Monthly Contribution ($)
              </label>
              <div class="currency-input-wrapper">
                <span class="currency-prefix" style="color: var(--brand-fuchsia);">$</span>
                <input type="text" inputmode="decimal" value="${escapeHtml(goal.monthlyContrib)}" placeholder="200"
                  class="input-field goal-prop-input" data-goal-id="${goal.id}" data-prop="monthlyContrib"
                  style="border-color: rgba(217, 70, 239, 0.4); color: var(--brand-fuchsia); font-weight: 700;">
              </div>
            </div>

            <div class="input-group">
              <label class="input-label tooltip-help" style="color: var(--brand-teal);" title="Deducts this monthly contribution from selected budget's wiggle room.">
                <i data-lucide="link" style="width: 0.75rem; height: 0.75rem;"></i> Deduct from Budget
              </label>
              <select class="select-field goal-link-budget" data-goal-id="${goal.id}">
                <option value="">-- None (Standalone) --</option>
                ${state.dashboards
                  .map((d) => `<option value="${d.id}" ${goal.linkedDashboardId == d.id ? "selected" : ""}>${escapeHtml(d.name)}</option>`)
                  .join("")}
              </select>
            </div>
          </div>

          <!-- Footer: Progress & Timeframe -->
          <div class="card-footer ${isMin ? "hidden" : ""}" style="${isMin ? "display: none;" : ""}">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.45rem;">
              <span class="input-label">Progress</span>
              <span class="font-mono goal-m-pct" style="font-weight: 800; font-size: 0.95rem; color: var(--brand-fuchsia);">${Math.round(metrics.progressPct)}%</span>
            </div>
            
            <div class="progress-track" style="margin-bottom: 0.85rem;">
              <div class="progress-fill goal-m-bar ${goal.color || "bg-fuchsia-500"}" style="width: ${metrics.progressPct}%;"></div>
            </div>

            <div class="metric-box" style="padding: 0.75rem 0.95rem;">
              <div style="display: flex; align-items: center; gap: 0.45rem; color: var(--text-muted);">
                <i data-lucide="clock" style="width: 0.95rem; height: 0.95rem;"></i>
                <span style="font-size: 0.8rem; font-weight: 600;">Time Remaining:</span>
              </div>
              <div style="text-align: right;">
                <span class="font-mono goal-m-time ${metrics.isCompleted ? "text-brand-emerald" : ""}" style="font-weight: 700; font-size: 1rem; ${metrics.isCompleted ? "color: var(--brand-emerald);" : ""}">
                  ${metrics.timeRemainingText}
                </span>
                <span class="goal-m-date" style="display: ${metrics.targetDateString ? "block" : "none"}; font-size: 0.7rem; color: var(--text-muted);">${metrics.targetDateString}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  // Live in-place input listeners
  container.querySelectorAll(".goal-prop-input").forEach((input) => {
    input.oninput = (e) => {
      const goalId = parseInt(e.target.dataset.goalId);
      const prop = e.target.dataset.prop;
      const goal = state.goals.find((g) => g.id === goalId);
      if (goal) {
        goal[prop] = e.target.value;
        const cardEl = document.getElementById(`goal-${goalId}`);
        updateGoalCardMetrics(cardEl, goal);
        if (typeof onFastUpdate === "function") onFastUpdate();
        updateStateSilently((s) => {
          const item = s.goals.find((x) => x.id === goalId);
          if (item) item[prop] = e.target.value;
        });
      }
    };
  });

  container.querySelectorAll(".goal-name-input").forEach((input) => {
    input.oninput = (e) => {
      const goalId = parseInt(e.target.dataset.goalId);
      const goal = state.goals.find((g) => g.id === goalId);
      if (goal) {
        goal.name = e.target.value;
        updateStateSilently((s) => {
          const item = s.goals.find((x) => x.id === goalId);
          if (item) item.name = e.target.value;
        });
      }
    };
  });

  container.querySelectorAll(".goal-link-budget").forEach((sel) => {
    sel.onchange = (e) => onUpdateProp(parseInt(e.target.dataset.goalId), "linkedDashboardId", e.target.value ? parseInt(e.target.value) : null);
  });

  // Structural Actions
  container.querySelectorAll(".goal-min-toggle").forEach((btn) => {
    btn.onclick = (e) => onToggleMinimize("goal", parseInt(e.currentTarget.dataset.goalId));
  });

  container.querySelectorAll(".goal-dup-btn").forEach((btn) => {
    btn.onclick = (e) => onDuplicate(parseInt(e.currentTarget.dataset.goalId));
  });

  container.querySelectorAll(".goal-del-btn").forEach((btn) => {
    btn.onclick = (e) => onDelete(parseInt(e.currentTarget.dataset.goalId));
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
      onUpdateColor("goal", parseInt(e.target.dataset.goalId), e.target.dataset.color);
    };
  });

  initSortableContainer(container, "goal", handlers.onReorder);
  refreshIcons();
}
