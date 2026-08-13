/**
 * Pure Mathematical Calculation Engine for FinanceHub
 */

import { parseNum } from "./utils.js";

/**
 * Calculate Budget / Cash Flow Metrics
 */
export function calcBudgetMetrics(dashboard, appData) {
  if (!dashboard) return null;

  const baseWeeklyInc = parseNum(dashboard.income);
  let yearlyEarn = 0;
  if (Array.isArray(dashboard.earnings)) {
    dashboard.earnings.forEach((e) => {
      const amt = parseNum(e.amount);
      if (e.freq === "weekly") yearlyEarn += amt * 52;
      else if (e.freq === "monthly") yearlyEarn += amt * 12;
      else if (e.freq === "yearly") yearlyEarn += amt;
    });
  }

  const yearlyInc = baseWeeklyInc * 52 + yearlyEarn;
  const monthlyInc = yearlyInc / 12;
  const weeklyInc = yearlyInc / 52;
  const dailyInc = yearlyInc / 365;

  let yearlyExp = 0;
  if (Array.isArray(dashboard.expenses)) {
    dashboard.expenses.forEach((e) => {
      const amt = parseNum(e.amount);
      if (e.freq === "weekly") yearlyExp += amt * 52;
      else if (e.freq === "monthly") yearlyExp += amt * 12;
      else if (e.freq === "yearly") yearlyExp += amt;
    });
  }

  // Linked Rent
  if (dashboard.linkedRentId && appData?.rents) {
    const linkedRent = appData.rents.find((r) => r.id === dashboard.linkedRentId);
    if (linkedRent) {
      const rentMetrics = calcRentMetrics(linkedRent);
      yearlyExp += rentMetrics.totalMonthly * 12;
    }
  }

  // Linked Loan
  if (dashboard.linkedLoanId && appData?.loans) {
    const linkedLoan = appData.loans.find((l) => l.id === dashboard.linkedLoanId);
    if (linkedLoan) {
      const loanMetrics = calcLoanMetrics(linkedLoan);
      yearlyExp += loanMetrics.actualPayment * 12;
    }
  }

  // Linked Investment APY
  let linkedInvContrib = 0;
  if (dashboard.linkedInvestmentId && appData?.investments) {
    const linkedInv = appData.investments.find((i) => i.id === dashboard.linkedInvestmentId);
    if (linkedInv && linkedInv.monthly) {
      linkedInvContrib = parseNum(linkedInv.monthly) * 12;
      yearlyExp += linkedInvContrib;
    }
  }

  // Linked Goals / Sinking Funds
  let linkedGoalContrib = 0;
  if (Array.isArray(appData?.goals)) {
    appData.goals
      .filter((g) => g.linkedDashboardId == dashboard.id)
      .forEach((g) => {
        linkedGoalContrib += parseNum(g.monthlyContrib) * 12;
      });
    yearlyExp += linkedGoalContrib;
  }

  const netYearly = yearlyInc - yearlyExp;
  const netMonthly = netYearly / 12;
  const netWeekly = netYearly / 52;

  // Savings rate
  let savingsRate = 0;
  if (yearlyInc > 0) {
    savingsRate = ((netYearly + linkedInvContrib + linkedGoalContrib) / yearlyInc) * 100;
  }

  // Core expenses only for emergency fund
  const coreYearlyExp = yearlyExp - linkedInvContrib - linkedGoalContrib;
  const coreMonthlyExp = coreYearlyExp / 12;
  const emergencyFund3Mo = coreMonthlyExp * 3;
  const emergencyFund6Mo = coreMonthlyExp * 6;

  return {
    dailyInc,
    weeklyInc,
    monthlyInc,
    yearlyInc,
    yearlyExp,
    monthlyExp: yearlyExp / 12,
    netWeekly,
    netMonthly,
    netYearly,
    savingsRate: Math.max(0, savingsRate),
    emergencyFund3Mo,
    emergencyFund6Mo,
  };
}

/**
 * Calculate Sinking Fund / Goal Metrics
 */
export function calcGoalMetrics(goal) {
  const target = parseNum(goal.targetAmount);
  const saved = parseNum(goal.savedAmount);
  const monthly = parseNum(goal.monthlyContrib);

  let progressPct = 0;
  if (target > 0) {
    progressPct = Math.min(100, (saved / target) * 100);
  }

  const isCompleted = target > 0 && saved >= target;
  let monthsRemaining = 0;
  let timeRemainingText = "--";
  let targetDateString = "";

  if (isCompleted) {
    timeRemainingText = "Completed! 🎉";
  } else if (monthly > 0 && target > saved) {
    monthsRemaining = Math.ceil((target - saved) / monthly);
    const yrs = Math.floor(monthsRemaining / 12);
    const rMo = monthsRemaining % 12;

    let str = "";
    if (yrs > 0) str += `${yrs}y `;
    if (rMo > 0 || yrs === 0) str += `${rMo}mo`;
    timeRemainingText = str;

    const goalDate = new Date();
    goalDate.setMonth(goalDate.getMonth() + monthsRemaining);
    targetDateString = goalDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  return {
    target,
    saved,
    monthly,
    progressPct,
    isCompleted,
    monthsRemaining,
    timeRemainingText,
    targetDateString,
  };
}

/**
 * Calculate Rent & Utility Metrics
 */
export function calcRentMetrics(rent) {
  const base = parseNum(rent.baseRent);
  const water = parseNum(rent.water);
  const electricity = parseNum(rent.electricity);
  const internet = parseNum(rent.internet);
  const other = parseNum(rent.other);

  const totalMonthly = base + water + electricity + internet + other;
  const totalYearly = totalMonthly * 12;

  return {
    base,
    water,
    electricity,
    internet,
    other,
    utilitiesTotal: water + electricity + internet + other,
    totalMonthly,
    totalYearly,
  };
}

/**
 * Calculate Loan Metrics (Base payment, extra payment, payoffs, interest saved)
 */
export function calcLoanMetrics(loan) {
  const P_curr = parseNum(loan.amount);
  const P_orig = parseNum(loan.origAmount) > 0 ? parseNum(loan.origAmount) : P_curr;
  const r = parseNum(loan.rate) / 100 / 12;
  const n_orig = parseNum(loan.years) * 12;
  const override = parseNum(loan.minPaymentOverride);
  const extra = parseNum(loan.extra);
  const lump = parseNum(loan.lumpSum);

  let base_payment = 0;
  if (override > 0) {
    base_payment = override;
  } else if (P_orig > 0 && n_orig > 0) {
    if (r === 0) {
      base_payment = P_orig / n_orig;
    } else {
      base_payment = (P_orig * (r * Math.pow(1 + r, n_orig))) / (Math.pow(1 + r, n_orig) - 1);
      if (!isFinite(base_payment) || isNaN(base_payment)) base_payment = P_orig / n_orig;
    }
  }

  const effectiveLump = Math.max(0, Math.min(lump, P_curr));
  const P_new = P_curr - effectiveLump;
  const actual_payment = base_payment + extra;

  let base_n = 0;
  let base_interest = 0;
  let new_n = 0;
  let new_interest = 0;
  let interest_saved = 0;
  let months_saved = 0;

  if (P_curr > 0 && base_payment > 0) {
    // Baseline
    if (r === 0) {
      base_n = P_curr / base_payment;
      base_interest = 0;
    } else if (base_payment > P_curr * r) {
      base_n = Math.log(base_payment / (base_payment - P_curr * r)) / Math.log(1 + r);
      base_interest = base_n * base_payment - P_curr;
    }

    // Accelerated
    if (P_new <= 0) {
      new_n = 0;
      new_interest = 0;
    } else if (r === 0) {
      new_n = P_new / actual_payment;
      new_interest = 0;
    } else if (actual_payment > P_new * r) {
      new_n = Math.log(actual_payment / (actual_payment - P_new * r)) / Math.log(1 + r);
      new_interest = Math.max(0, new_n * actual_payment - P_new);
    }

    interest_saved = Math.max(0, base_interest - new_interest);
    months_saved = Math.max(0, base_n - new_n);
  }

  // Payment Breakdown
  const first_mo_int = P_new > 0 && r > 0 ? P_new * r : 0;
  let first_mo_prin = actual_payment > 0 ? actual_payment - first_mo_int : 0;
  if (first_mo_prin < 0) first_mo_prin = 0;

  const int_pct = actual_payment > 0 ? Math.min(100, (first_mo_int / actual_payment) * 100) : 0;

  // Payoff date
  let payoffDateString = "--";
  const isPaidOff = P_new <= 0 && P_curr > 0;
  if (isPaidOff) {
    payoffDateString = "Paid Off! 🎉";
  } else if (new_n > 0 && isFinite(new_n)) {
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + Math.ceil(new_n));
    payoffDateString = payoffDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  // Efficiency
  let efficiency = 0;
  if (base_interest > 0) {
    efficiency = (interest_saved / base_interest) * 100;
  } else if (base_n > 0) {
    efficiency = (months_saved / base_n) * 100;
  }
  efficiency = Math.max(0, Math.min(100, efficiency || 0));

  return {
    P_curr,
    P_orig,
    r,
    base_payment,
    actualPayment: actual_payment > 0 ? actual_payment : base_payment,
    base_interest: Math.max(0, base_interest),
    new_interest: Math.max(0, new_interest),
    interest_saved,
    months_saved,
    first_mo_int,
    first_mo_prin,
    int_pct,
    payoffDateString,
    isPaidOff,
    efficiency,
    monthsRemaining: Math.ceil(new_n),
  };
}

/**
 * Calculate Golden-Distance "Elbow" Curve for Loan Payoff Optimization
 */
export function calcLoanSweetSpot(loan, mode = "monthly") {
  const P_curr = parseNum(loan.amount);
  const P_orig = parseNum(loan.origAmount) > 0 ? parseNum(loan.origAmount) : P_curr;
  const n_orig = parseNum(loan.years) * 12;
  const override = parseNum(loan.minPaymentOverride);
  const r = parseNum(loan.rate) / 100 / 12;

  if (P_curr <= 0) return null;

  let base_payment = 0;
  if (override > 0) {
    base_payment = override;
  } else if (n_orig > 0) {
    base_payment =
      r === 0
        ? P_orig / n_orig
        : (P_orig * (r * Math.pow(1 + r, n_orig))) / (Math.pow(1 + r, n_orig) - 1);
    if (!isFinite(base_payment) || isNaN(base_payment)) base_payment = P_orig / n_orig;
  }

  if (base_payment <= 0) return null;

  const maxSteps = 20;
  const labels = [];
  const interestData = [];
  const timeData = [];
  const interestDataBaseline = [];
  const timeDataBaseline = [];
  const rawValues = [];

  for (let i = 0; i <= maxSteps; i++) {
    let calc_n = 0;
    let calc_interest = 0;
    let base_n = 0;
    let base_int = 0;

    if (mode === "monthly") {
      const maxExtra = Math.max(base_payment * 2, 500);
      const step = maxExtra / maxSteps;
      const extra_i = i * step;
      rawValues.push(extra_i);

      const effectiveLump = Math.max(0, Math.min(parseNum(loan.lumpSum), P_curr));
      const P_new = P_curr - effectiveLump;
      const payment = base_payment + extra_i;

      labels.push("$" + Math.round(extra_i).toLocaleString());

      if (r === 0) {
        calc_n = P_new / payment;
        calc_interest = 0;
      } else if (P_new <= 0) {
        calc_n = 0;
        calc_interest = 0;
      } else if (payment > P_new * r) {
        calc_n = Math.log(payment / (payment - P_new * r)) / Math.log(1 + r);
        calc_interest = calc_n * payment - P_new;
      } else {
        calc_n = n_orig;
        calc_interest = base_payment * n_orig - P_new;
      }

      // Baseline
      if (r === 0) {
        base_n = P_curr / payment;
        base_int = 0;
      } else if (payment > P_curr * r) {
        base_n = Math.log(payment / (payment - P_curr * r)) / Math.log(1 + r);
        base_int = base_n * payment - P_curr;
      } else {
        base_n = n_orig;
        base_int = base_payment * n_orig - P_curr;
      }
    } else {
      // Lump Sum Mode
      const maxLump = P_curr * 0.75;
      const step = maxLump / maxSteps;
      const lump_i = i * step;
      rawValues.push(lump_i);

      const P_new = P_curr - lump_i;
      const payment = base_payment + parseNum(loan.extra);

      labels.push("$" + Math.round(lump_i).toLocaleString());

      if (r === 0) {
        calc_n = P_new / payment;
        calc_interest = 0;
      } else if (P_new <= 0) {
        calc_n = 0;
        calc_interest = 0;
      } else if (payment > P_new * r) {
        calc_n = Math.log(payment / (payment - P_new * r)) / Math.log(1 + r);
        calc_interest = calc_n * payment - P_new;
      } else {
        calc_n = n_orig;
        calc_interest = base_payment * n_orig - P_new;
      }

      if (r === 0) {
        base_n = P_curr / payment;
        base_int = 0;
      } else if (payment > P_curr * r) {
        base_n = Math.log(payment / (payment - P_curr * r)) / Math.log(1 + r);
        base_int = base_n * payment - P_curr;
      } else {
        base_n = n_orig;
        base_int = base_payment * n_orig - P_curr;
      }
    }

    interestData.push(Math.max(0, Math.round(calc_interest)));
    timeData.push(Math.max(0, Math.round((calc_n / 12) * 10) / 10));
    interestDataBaseline.push(Math.max(0, Math.round(base_int)));
    timeDataBaseline.push(Math.max(0, Math.round((base_n / 12) * 10) / 10));
  }

  // Find elbow
  let bestIdx = 0;
  let maxDist = -1;
  const yMax = interestData[0];
  const yMin = interestData[interestData.length - 1];

  if (yMax !== yMin) {
    for (let i = 0; i <= maxSteps; i++) {
      const normX = i / maxSteps;
      const normY = (interestData[i] - yMin) / (yMax - yMin);
      const dist = Math.abs(normX + normY - 1);
      if (dist > maxDist && !isNaN(dist)) {
        maxDist = dist;
        bestIdx = i;
      }
    }
  }

  return {
    labels,
    interestData,
    timeData,
    interestDataBaseline,
    timeDataBaseline,
    bestIdx,
    optimalValue: Math.round(rawValues[bestIdx] || 0),
    optimalLabel: labels[bestIdx] + (mode === "monthly" ? " Extra/mo" : " Lump Sum"),
    optimalInterest: interestData[bestIdx],
    optimalTime: timeData[bestIdx],
  };
}

/**
 * Generate full month-by-month Amortization Schedule
 */
export function calcAmortizationSchedule(loan) {
  const P_curr = parseNum(loan.amount);
  const P_orig = parseNum(loan.origAmount) > 0 ? parseNum(loan.origAmount) : P_curr;
  const n_orig = parseNum(loan.years) * 12;
  const override = parseNum(loan.minPaymentOverride);
  const r = parseNum(loan.rate) / 100 / 12;

  let base_payment = 0;
  if (override > 0) {
    base_payment = override;
  } else if (P_orig > 0 && n_orig > 0) {
    base_payment =
      r === 0
        ? P_orig / n_orig
        : (P_orig * (r * Math.pow(1 + r, n_orig))) / (Math.pow(1 + r, n_orig) - 1);
    if (!isFinite(base_payment) || isNaN(base_payment)) base_payment = P_orig / n_orig;
  }

  const effectiveLump = Math.max(0, Math.min(parseNum(loan.lumpSum), P_curr));
  let balance = P_curr - effectiveLump;
  const actual_payment = base_payment + parseNum(loan.extra);

  if (balance <= 0 || actual_payment <= 0) return [];

  const schedule = [];
  let month = 1;
  const maxMonths = 360; // 30 years limit

  while (balance > 0.01 && month <= maxMonths) {
    const interest = balance * r;
    let payment = actual_payment;
    let principal = payment - interest;

    if (balance + interest < payment) {
      payment = balance + interest;
      principal = balance;
      balance = 0;
    } else {
      balance -= principal;
    }

    schedule.push({
      month,
      payment,
      interest,
      principal,
      balance: Math.max(0, balance),
    });

    month++;
  }

  return schedule;
}

/**
 * Calculate APY & High-Yield Savings Growth Metrics
 */
export function calcInvestmentMetrics(inv) {
  const P = parseNum(inv.principal);
  const PMT = parseNum(inv.monthly);
  const cap = parseNum(inv.rateCap);
  const taxMult = 1 - parseNum(inv.taxBracket) / 100;
  const r_m1 = ((parseNum(inv.rate) / 100) * taxMult) / 12;
  const r_m2 = ((parseNum(inv.rateOverCap) / 100) * taxMult) / 12;

  const calcFutureValue = (years) => {
    let currentBal = P;
    for (let m = 1; m <= years * 12; m++) {
      let interest = 0;
      if (cap > 0) {
        interest = Math.min(currentBal, cap) * r_m1 + Math.max(0, currentBal - cap) * r_m2;
      } else {
        interest = currentBal * r_m1;
      }
      currentBal += interest + PMT;
    }
    return currentBal;
  };

  let estMonthlyYield = 0;
  if (cap > 0) {
    estMonthlyYield = Math.min(P, cap) * r_m1 + Math.max(0, P - cap) * r_m2;
  } else {
    estMonthlyYield = P * r_m1;
  }

  return {
    principal: P,
    monthly: PMT,
    firstMonthYield: estMonthlyYield,
    fv1Year: calcFutureValue(1),
    fv2Years: calcFutureValue(2),
    fv5Years: calcFutureValue(5),
    fv10Years: calcFutureValue(10),
  };
}

/**
 * Calculate 30-Year Compound Growth Series for APY Chart
 */
export function calcInvestment30YearSeries(inv) {
  const P = parseNum(inv.principal);
  const PMT = parseNum(inv.monthly);
  const cap = parseNum(inv.rateCap);
  const taxMult = 1 - parseNum(inv.taxBracket) / 100;
  const r_m1 = ((parseNum(inv.rate) / 100) * taxMult) / 12;
  const r_m2 = ((parseNum(inv.rateOverCap) / 100) * taxMult) / 12;

  const labels = ["Year 0"];
  const principalData = [P];
  const interestData = [0];

  let currentBal = P;
  let currentPrin = P;

  for (let y = 1; y <= 30; y++) {
    for (let m = 1; m <= 12; m++) {
      let interest = 0;
      if (cap > 0) {
        interest = Math.min(currentBal, cap) * r_m1 + Math.max(0, currentBal - cap) * r_m2;
      } else {
        interest = currentBal * r_m1;
      }
      currentBal += interest + PMT;
      currentPrin += PMT;
    }
    labels.push(`Year ${y}`);
    principalData.push(Math.round(currentPrin));
    interestData.push(Math.round(Math.max(0, currentBal - currentPrin)));
  }

  return {
    labels,
    principalData,
    interestData,
    finalPrincipal: currentPrin,
    finalInterest: Math.max(0, currentBal - currentPrin),
    finalBalance: currentBal,
  };
}

/**
 * Calculate Global Net Worth & Master Overview Aggregations
 */
export function calcOverviewMetrics(appData) {
  let totalAssets = 0;
  if (Array.isArray(appData?.investments)) {
    appData.investments.forEach((i) => {
      totalAssets += parseNum(i.principal);
    });
  }
  if (Array.isArray(appData?.goals)) {
    appData.goals.forEach((g) => {
      totalAssets += parseNum(g.savedAmount);
    });
  }

  let totalDebt = 0;
  if (Array.isArray(appData?.loans)) {
    appData.loans.forEach((l) => {
      const bal = parseNum(l.amount) - parseNum(l.lumpSum);
      if (bal > 0) totalDebt += bal;
    });
  }

  const netWorth = totalAssets - totalDebt;

  return {
    totalAssets,
    totalDebt,
    netWorth,
    isPositiveNetWorth: netWorth >= 0,
  };
}
