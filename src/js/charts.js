/**
 * Chart.js Integration for FinanceHub Visualizations
 */

import { fmt, colorMap } from "./utils.js";
import { calcBudgetMetrics, calcRentMetrics, calcLoanMetrics } from "./calculations.js";

let sweetSpotChartInstance = null;
let apyChartInstance = null;
let compareChartInstance = null;

function getChartThemeColors(isDark) {
  return {
    gridColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
    textColor: isDark ? "#94a3b8" : "#64748b",
    tooltipBg: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
    tooltipText: isDark ? "#f8fafc" : "#0f172a",
    tooltipBorder: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
  };
}

/**
 * Render Loan Sweet Spot Curve Chart
 */
export function renderSweetSpotChart(canvasEl, sweetSpotData, isDark, hasLumpSum = false, mode = "monthly") {
  if (!canvasEl || typeof Chart === "undefined" || !sweetSpotData) return null;

  if (sweetSpotChartInstance) {
    sweetSpotChartInstance.destroy();
    sweetSpotChartInstance = null;
  }

  const { gridColor, textColor, tooltipBg, tooltipText, tooltipBorder } = getChartThemeColors(isDark);

  const datasets = [
    {
      label: mode === "monthly" && hasLumpSum ? "Interest (With Lump Sum)" : "Total Interest Paid ($)",
      data: sweetSpotData.interestData,
      borderColor: "#f43f5e",
      backgroundColor: "rgba(244, 63, 94, 0.12)",
      borderWidth: 2.5,
      fill: mode === "monthly" && !hasLumpSum,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: "#f43f5e",
      yAxisID: "y",
    },
    {
      label: mode === "monthly" && hasLumpSum ? "Years (With Lump Sum)" : "Years to Payoff",
      data: sweetSpotData.timeData,
      borderColor: "#3b82f6",
      backgroundColor: "transparent",
      borderWidth: 2.5,
      borderDash: [5, 5],
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: "#3b82f6",
      yAxisID: "y1",
    },
  ];

  if (mode === "monthly" && hasLumpSum) {
    datasets.push({
      label: "Baseline Interest (No Lump Sum)",
      data: sweetSpotData.interestDataBaseline,
      borderColor: isDark ? "rgba(244, 63, 94, 0.4)" : "rgba(244, 63, 94, 0.3)",
      borderWidth: 2,
      fill: true,
      backgroundColor: "rgba(244, 63, 94, 0.04)",
      tension: 0.3,
      pointRadius: 0,
      yAxisID: "y",
    });
    datasets.push({
      label: "Baseline Years (No Lump Sum)",
      data: sweetSpotData.timeDataBaseline,
      borderColor: isDark ? "rgba(59, 130, 246, 0.4)" : "rgba(59, 130, 246, 0.3)",
      borderWidth: 2,
      borderDash: [4, 4],
      tension: 0.3,
      pointRadius: 0,
      yAxisID: "y1",
    });
  }

  const ctx = canvasEl.getContext("2d");
  sweetSpotChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: sweetSpotData.labels,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: textColor,
            font: {
              family: "'Plus Jakarta Sans', sans-serif",
              weight: "600",
              size: 12,
            },
            usePointStyle: true,
            boxWidth: 8,
          },
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipText,
          borderColor: tooltipBorder,
          borderWidth: 1,
          padding: 10,
          boxPadding: 4,
          usePointStyle: true,
          callbacks: {
            title: (items) => `${mode === "monthly" ? "Extra Monthly: " : "Lump Sum: "}${items[0].label}`,
            label: (context) => {
              if (context.dataset.yAxisID === "y1") {
                return `${context.dataset.label}: ${context.raw} yrs`;
              }
              return `${context.dataset.label}: ${fmt.format(context.raw)}`;
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: mode === "monthly" ? "Extra Monthly Payment" : "One-Time Lump Sum",
            color: textColor,
            font: { weight: "700", size: 11 },
          },
          grid: { color: gridColor, drawBorder: false },
          ticks: { color: textColor, maxTicksLimit: 8 },
        },
        y: {
          type: "linear",
          display: true,
          position: "left",
          title: {
            display: true,
            text: "Total Interest ($)",
            color: "#f43f5e",
            font: { weight: "700", size: 11 },
          },
          grid: { color: gridColor, drawBorder: false },
          ticks: {
            color: textColor,
            callback: (v) => "$" + v.toLocaleString(),
          },
        },
        y1: {
          type: "linear",
          display: true,
          position: "right",
          title: {
            display: true,
            text: "Years Remaining",
            color: "#3b82f6",
            font: { weight: "700", size: 11 },
          },
          grid: { drawOnChartArea: false },
          ticks: { color: textColor },
        },
      },
    },
  });

  return sweetSpotChartInstance;
}

/**
 * Render APY 30-Year Growth Projection Chart (Stacked Area)
 */
export function renderApyChart(canvasEl, apySeries, isDark) {
  if (!canvasEl || typeof Chart === "undefined" || !apySeries) return null;

  if (apyChartInstance) {
    apyChartInstance.destroy();
    apyChartInstance = null;
  }

  const { gridColor, textColor, tooltipBg, tooltipText, tooltipBorder } = getChartThemeColors(isDark);
  const ctx = canvasEl.getContext("2d");

  apyChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: apySeries.labels,
      datasets: [
        {
          label: "Total Contributions (Principal)",
          data: apySeries.principalData,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.25)",
          borderWidth: 2.5,
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
        {
          label: "Compound Interest Earned",
          data: apySeries.interestData,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.35)",
          borderWidth: 2.5,
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: textColor,
            font: {
              family: "'Plus Jakarta Sans', sans-serif",
              weight: "600",
              size: 12,
            },
            usePointStyle: true,
            boxWidth: 8,
          },
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipText,
          borderColor: tooltipBorder,
          borderWidth: 1,
          padding: 10,
          boxPadding: 4,
          usePointStyle: true,
          callbacks: {
            label: (context) => `${context.dataset.label}: ${fmt.format(context.raw)}`,
            footer: (items) => {
              const total = items.reduce((acc, curr) => acc + curr.raw, 0);
              return `Total Balance: ${fmt.format(total)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: gridColor, drawBorder: false },
          ticks: { color: textColor, maxTicksLimit: 10 },
        },
        y: {
          stacked: true,
          grid: { color: gridColor, drawBorder: false },
          ticks: {
            color: textColor,
            callback: (v) => "$" + v.toLocaleString(),
          },
        },
      },
    },
  });

  return apyChartInstance;
}

/**
 * Render Multi-Scenario Comparison Chart (Bar, Line, Radar)
 */
export function renderCompareChart(canvasEl, category = "loan", chartType = "bar", state = null, isDark = false) {
  if (!canvasEl || typeof Chart === "undefined" || !state) return null;

  if (compareChartInstance) {
    compareChartInstance.destroy();
    compareChartInstance = null;
  }

  const { gridColor, textColor, tooltipBg, tooltipText, tooltipBorder } = getChartThemeColors(isDark);
  const ctx = canvasEl.getContext("2d");

  let labels = [];
  let datasets = [];

  if (category === "loan") {
    labels = state.loans.map((l) => l.name || "Loan");
    const paymentData = [];
    const interestData = [];

    state.loans.forEach((loan) => {
      const m = calcLoanMetrics(loan);
      paymentData.push(Math.round(m.actualPayment));
      interestData.push(Math.round(m.new_interest));
    });

    datasets = [
      {
        label: "Monthly Payment ($)",
        data: paymentData,
        backgroundColor: "rgba(14, 165, 233, 0.7)",
        borderColor: "#0ea5e9",
        borderWidth: 1.5,
      },
      {
        label: "Total Lifetime Interest ($)",
        data: interestData,
        backgroundColor: "rgba(244, 63, 94, 0.7)",
        borderColor: "#f43f5e",
        borderWidth: 1.5,
      },
    ];
  } else if (category === "dashboard") {
    labels = state.dashboards.map((d) => d.name || "Budget");
    const incomeData = [];
    const expenseData = [];
    const wiggleData = [];

    state.dashboards.forEach((d) => {
      const m = calcBudgetMetrics(d, state);
      incomeData.push(Math.round(m.monthlyInc));
      expenseData.push(Math.round(m.monthlyExp));
      wiggleData.push(Math.round(m.netMonthly));
    });

    datasets = [
      {
        label: "Monthly Income ($)",
        data: incomeData,
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderColor: "#10b981",
        borderWidth: 1.5,
      },
      {
        label: "Monthly Outflow ($)",
        data: expenseData,
        backgroundColor: "rgba(244, 63, 94, 0.7)",
        borderColor: "#f43f5e",
        borderWidth: 1.5,
      },
      {
        label: "Net Wiggle Room ($)",
        data: wiggleData,
        backgroundColor: "rgba(14, 165, 233, 0.7)",
        borderColor: "#0ea5e9",
        borderWidth: 1.5,
      },
    ];
  } else if (category === "rent") {
    labels = state.rents.map((r) => r.name || "Rent");
    const baseRentData = [];
    const utilitiesData = [];

    state.rents.forEach((r) => {
      const m = calcRentMetrics(r);
      baseRentData.push(Math.round(m.base));
      utilitiesData.push(Math.round(m.utilitiesTotal));
    });

    datasets = [
      {
        label: "Base Rent ($)",
        data: baseRentData,
        backgroundColor: "rgba(14, 165, 233, 0.7)",
        borderColor: "#0ea5e9",
        borderWidth: 1.5,
      },
      {
        label: "Utilities & Fees ($)",
        data: utilitiesData,
        backgroundColor: "rgba(245, 158, 11, 0.7)",
        borderColor: "#f59e0b",
        borderWidth: 1.5,
      },
    ];
  } else if (category === "interest") {
    labels = state.investments.map((i) => i.name || "Account");
    const yieldData = [];
    const fv5Data = [];

    state.investments.forEach((i) => {
      const m = calcInvestmentMetrics(i);
      yieldData.push(Math.round(m.firstMonthYield * 12));
      fv5Data.push(Math.round(m.fv5Years));
    });

    datasets = [
      {
        label: "Est. Year 1 Yield ($)",
        data: yieldData,
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderColor: "#10b981",
        borderWidth: 1.5,
      },
      {
        label: "5-Year Projected Balance ($)",
        data: fv5Data,
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderColor: "#3b82f6",
        borderWidth: 1.5,
      },
    ];
  }

  const isRadar = chartType === "radar";

  compareChartInstance = new Chart(ctx, {
    type: chartType,
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: textColor,
            font: {
              family: "'Plus Jakarta Sans', sans-serif",
              weight: "600",
              size: 12,
            },
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipText,
          borderColor: tooltipBorder,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (c) => `${c.dataset.label}: ${fmt.format(c.raw)}`,
          },
        },
      },
      scales: isRadar
        ? {
            r: {
              grid: { color: gridColor },
              angleLines: { color: gridColor },
              pointLabels: { color: textColor, font: { weight: "600", size: 12 } },
              ticks: { color: textColor, backdropColor: "transparent" },
            },
          }
        : {
            x: {
              grid: { color: gridColor, drawBorder: false },
              ticks: { color: textColor },
            },
            y: {
              grid: { color: gridColor, drawBorder: false },
              ticks: {
                color: textColor,
                callback: (v) => "$" + v.toLocaleString(),
              },
            },
          },
    },
  });

  return compareChartInstance;
}
