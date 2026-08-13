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
      borderWidth: 3,
      fill: mode === "monthly" && !hasLumpSum,
      tension: 0.35,
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
      borderWidth: 3,
      borderDash: [5, 5],
      tension: 0.35,
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
      tension: 0.35,
      pointRadius: 0,
      yAxisID: "y",
    });
    datasets.push({
      label: "Baseline Years (No Lump Sum)",
      data: sweetSpotData.timeDataBaseline,
      borderColor: isDark ? "rgba(59, 130, 246, 0.4)" : "rgba(59, 130, 246, 0.3)",
      borderWidth: 2,
      borderDash: [4, 4],
      tension: 0.35,
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
          padding: 12,
          boxPadding: 6,
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
            font: { weight: "700", size: 12 },
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
            font: { weight: "700", size: 12 },
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
            font: { weight: "700", size: 12 },
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
          label: "Total Principal (Your Money)",
          data: apySeries.principalData,
          borderColor: "#3b82f6",
          backgroundColor: isDark ? "rgba(59, 130, 246, 0.45)" : "rgba(59, 130, 246, 0.35)",
          fill: true,
          borderWidth: 2,
          tension: 0.15,
          pointRadius: 0,
        },
        {
          label: "Compound Interest (Bank Money)",
          data: apySeries.interestData,
          borderColor: "#10b981",
          backgroundColor: isDark ? "rgba(16, 185, 129, 0.45)" : "rgba(16, 185, 129, 0.35)",
          fill: true,
          borderWidth: 2,
          tension: 0.15,
          pointRadius: 0,
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
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${fmt.format(ctx.raw)}`,
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
          title: {
            display: true,
            text: "Total Balance ($)",
            color: textColor,
            font: { weight: "700" },
          },
        },
      },
    },
  });

  return apyChartInstance;
}

/**
 * Render Scenario Comparison Chart (Bar, Line, Radar)
 */
export function renderCompareChart(canvasEl, type, chartType, appData, isDark) {
  if (!canvasEl || typeof Chart === "undefined" || !appData) return null;

  if (compareChartInstance) {
    compareChartInstance.destroy();
    compareChartInstance = null;
  }

  const { gridColor, textColor, tooltipBg, tooltipText, tooltipBorder } = getChartThemeColors(isDark);

  let labels = [];
  let datasets = [];

  if (type === "loan") {
    const validLoans = appData.loans.filter((l) => (parseFloat(l.amount) || 0) > 0);
    if (validLoans.length === 0) return null;

    labels = validLoans.map((l) => l.name);
    const intData = [];
    const timeData = [];
    const bgColorsInt = [];

    validLoans.forEach((l) => {
      const metrics = calcLoanMetrics(l);
      intData.push(metrics.new_interest);
      timeData.push(metrics.monthsRemaining / 12);
      bgColorsInt.push(colorMap[l.color] || "#0ea5e9");
    });

    datasets = [
      {
        label: "Total Interest Paid ($)",
        data: intData,
        backgroundColor: bgColorsInt,
        borderRadius: 6,
        yAxisID: "y",
      },
      {
        label: "Years to Payoff",
        data: timeData,
        backgroundColor: isDark ? "rgba(59, 130, 246, 0.8)" : "rgba(59, 130, 246, 0.4)",
        borderColor: "#3b82f6",
        borderWidth: 2,
        borderRadius: 6,
        yAxisID: "y1",
      },
    ];
  } else if (type === "interest") {
    const validInvs = appData.investments;
    if (validInvs.length === 0) return null;

    labels = Array.from({ length: 11 }, (_, i) => `Year ${i}`);

    datasets = validInvs.map((inv) => {
      const p = parseFloat(inv.principal) || 0;
      const pmt = parseFloat(inv.monthly) || 0;
      const rate = (parseFloat(inv.rate) || 0) / 100;
      const rateOver = (parseFloat(inv.rateOverCap) || 0) / 100;
      const cap = parseFloat(inv.rateCap) || 0;
      const taxMult = 1 - (parseFloat(inv.taxBracket) || 0) / 100;

      const r1 = (rate * taxMult) / 12;
      const r2 = (rateOver * taxMult) / 12;

      const balances = [p];
      let currentBal = p;

      for (let y = 1; y <= 10; y++) {
        for (let m = 1; m <= 12; m++) {
          let interest = cap > 0
            ? Math.min(currentBal, cap) * r1 + Math.max(0, currentBal - cap) * r2
            : currentBal * r1;
          currentBal += interest + pmt;
        }
        balances.push(Math.round(currentBal));
      }

      const hex = colorMap[inv.color] || "#3b82f6";
      return {
        label: inv.name,
        data: balances,
        borderColor: hex,
        backgroundColor: hex + "33",
        borderWidth: 3,
        tension: 0.35,
        fill: false,
      };
    });
  } else if (type === "dashboard") {
    if (appData.dashboards.length === 0) return null;
    labels = appData.dashboards.map((d) => d.name);

    const incData = [];
    const expData = [];
    const netData = [];

    appData.dashboards.forEach((d) => {
      const metrics = calcBudgetMetrics(d, appData);
      incData.push(Math.round(metrics.monthlyInc));
      expData.push(Math.round(metrics.monthlyExp));
      netData.push(Math.round(metrics.netMonthly));
    });

    datasets = [
      { label: "Monthly Income", data: incData, backgroundColor: "#10b981", borderRadius: 6 },
      { label: "Monthly Expenses", data: expData, backgroundColor: "#f43f5e", borderRadius: 6 },
      { label: "Wiggle Room", data: netData, backgroundColor: "#3b82f6", borderRadius: 6 },
    ];
  } else if (type === "rent") {
    if (appData.rents.length === 0) return null;
    labels = appData.rents.map((r) => r.name);

    const baseData = appData.rents.map((r) => parseFloat(r.baseRent) || 0);
    const utilData = appData.rents.map((r) => {
      const m = calcRentMetrics(r);
      return m.utilitiesTotal;
    });

    datasets = [
      { label: "Base Rent", data: baseData, backgroundColor: "#3b82f6", borderRadius: 6 },
      { label: "Utilities & Fees", data: utilData, backgroundColor: "#f59e0b", borderRadius: 6 },
    ];
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          color: textColor,
          font: { family: "'Plus Jakarta Sans', sans-serif", weight: "600" },
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tooltipText,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: 12,
      },
    },
  };

  if (chartType === "radar") {
    chartOptions.scales = {
      r: {
        grid: { color: gridColor },
        pointLabels: { color: textColor, font: { weight: "700" } },
        ticks: { display: false },
      },
    };
    datasets.forEach((ds) => {
      delete ds.yAxisID;
      if (Array.isArray(ds.backgroundColor)) {
        ds.backgroundColor = ds.backgroundColor.map((c) => (c.length === 7 ? c + "33" : c));
        ds.borderColor = ds.backgroundColor.map((c) => c.substring(0, 7));
        ds.borderWidth = 2;
      }
    });
  } else {
    chartOptions.scales = {
      x: {
        stacked: type === "rent" && chartType === "bar",
        grid: { color: gridColor, drawBorder: false },
        ticks: { color: textColor },
      },
      y: {
        stacked: type === "rent" && chartType === "bar",
        grid: { color: gridColor, drawBorder: false },
        ticks: {
          color: textColor,
          callback: (v) => "$" + v.toLocaleString(),
        },
      },
      ...(type === "loan" && (chartType === "bar" || chartType === "line")
        ? {
            y1: {
              type: "linear",
              display: true,
              position: "right",
              grid: { drawOnChartArea: false },
              ticks: { color: "#3b82f6" },
              title: { display: true, text: "Years", color: "#3b82f6", font: { weight: "700" } },
            },
          }
        : {}),
    };
  }

  const ctx = canvasEl.getContext("2d");
  compareChartInstance = new Chart(ctx, {
    type: chartType || "bar",
    data: { labels, datasets },
    options: chartOptions,
  });

  return compareChartInstance;
}
