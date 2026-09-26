import { VaultDebtInfo, DEFAULT_DAILY_INTEREST_RATE, createEmptyDebtInfo } from '../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Calculates and accrues daily interest based on elapsed time.
 */
export function calculateAccruedDebt(
  debt: VaultDebtInfo,
  currentTimestamp: number = Date.now()
): VaultDebtInfo {
  if (debt.principal <= 0) {
    return {
      ...debt,
      principal: 0,
      accruedInterest: 0,
      borrowedAt: 0,
      lastAccrualTimestamp: currentTimestamp,
      weeklyDueDate: 0,
    };
  }

  const lastAccrual = debt.lastAccrualTimestamp || debt.borrowedAt || currentTimestamp;
  const elapsedMs = Math.max(0, currentTimestamp - lastAccrual);
  const elapsedDays = Math.floor(elapsedMs / MS_PER_DAY);

  if (elapsedDays <= 0) {
    return debt;
  }

  // Daily interest = Principal * (Rate / 100) per day
  const dailyRate = debt.dailyRatePercent || DEFAULT_DAILY_INTEREST_RATE;
  const newAccruedInterest = Math.round(debt.principal * (dailyRate / 100) * elapsedDays);

  return {
    ...debt,
    accruedInterest: debt.accruedInterest + newAccruedInterest,
    lastAccrualTimestamp: lastAccrual + elapsedDays * MS_PER_DAY,
  };
}

/**
 * Borrow an amount from the vault with daily interest.
 */
export function borrowFromVault(
  currentDebt: VaultDebtInfo,
  amount: number,
  currentTimestamp: number = Date.now()
): VaultDebtInfo {
  if (amount <= 0) return currentDebt;

  // Accrue existing debt first
  const updated = calculateAccruedDebt(currentDebt, currentTimestamp);

  const isFirstBorrow = updated.principal <= 0;
  const borrowedAt = isFirstBorrow ? currentTimestamp : updated.borrowedAt || currentTimestamp;
  const weeklyDueDate = isFirstBorrow || updated.weeklyDueDate === 0
    ? currentTimestamp + 7 * MS_PER_DAY
    : updated.weeklyDueDate;

  return {
    ...updated,
    principal: updated.principal + amount,
    borrowedAt,
    lastAccrualTimestamp: isFirstBorrow ? currentTimestamp : updated.lastAccrualTimestamp,
    weeklyDueDate,
    totalBorrowedHistorical: (updated.totalBorrowedHistorical || 0) + amount,
    debtForgivenByPatron: false,
  };
}

/**
 * Repay debt (pays interest first, then principal).
 */
export function repayDebt(
  currentDebt: VaultDebtInfo,
  repayAmount: number
): { updatedDebt: VaultDebtInfo; actualRepaid: number } {
  if (repayAmount <= 0) return { updatedDebt: currentDebt, actualRepaid: 0 };

  const totalOutstanding = currentDebt.principal + currentDebt.accruedInterest;
  const amountToApply = Math.min(repayAmount, totalOutstanding);

  let remainingPayment = amountToApply;
  let newAccruedInterest = currentDebt.accruedInterest;
  let newPrincipal = currentDebt.principal;

  // 1. Pay accrued interest first
  if (newAccruedInterest > 0) {
    const interestPayment = Math.min(remainingPayment, newAccruedInterest);
    newAccruedInterest -= interestPayment;
    remainingPayment -= interestPayment;
  }

  // 2. Pay remaining amount against principal
  if (remainingPayment > 0 && newPrincipal > 0) {
    const principalPayment = Math.min(remainingPayment, newPrincipal);
    newPrincipal -= principalPayment;
    remainingPayment -= principalPayment;
  }

  const isCleared = newPrincipal <= 0 && newAccruedInterest <= 0;

  const updatedDebt: VaultDebtInfo = {
    ...currentDebt,
    principal: Math.max(0, newPrincipal),
    accruedInterest: Math.max(0, newAccruedInterest),
    borrowedAt: isCleared ? 0 : currentDebt.borrowedAt,
    weeklyDueDate: isCleared ? 0 : currentDebt.weeklyDueDate,
    totalRepaidHistorical: (currentDebt.totalRepaidHistorical || 0) + amountToApply,
  };

  return { updatedDebt, actualRepaid: amountToApply };
}

/**
 * Simulates the passage of 1 or more days for testing/interactive inspection.
 */
export function simulateAddDays(
  debt: VaultDebtInfo,
  days: number = 1
): VaultDebtInfo {
  if (debt.principal <= 0) return debt;

  const dailyRate = debt.dailyRatePercent || DEFAULT_DAILY_INTEREST_RATE;
  const addedInterest = Math.round(debt.principal * (dailyRate / 100) * days);

  return {
    ...debt,
    accruedInterest: debt.accruedInterest + addedInterest,
    simulatedDaysElapsed: (debt.simulatedDaysElapsed || 0) + days,
  };
}

/**
 * Calculates remaining days and hours until the weekly interest due date.
 */
export function getRemainingDaysUntilWeeklyDue(
  weeklyDueDate: number,
  simulatedDaysElapsed: number = 0,
  currentTimestamp: number = Date.now()
): { days: number; hours: number; isOverdue: boolean; text: string } {
  if (!weeklyDueDate) {
    return { days: 7, hours: 0, isOverdue: false, text: 'Aktif borç bulunmuyor' };
  }

  // Factor in simulated days
  const effectiveCurrentTime = currentTimestamp + simulatedDaysElapsed * MS_PER_DAY;
  const diffMs = weeklyDueDate - effectiveCurrentTime;

  if (diffMs <= 0) {
    const overdueDays = Math.floor(Math.abs(diffMs) / MS_PER_DAY);
    return {
      days: overdueDays,
      hours: 0,
      isOverdue: true,
      text: overdueDays > 0 ? `${overdueDays} gün gecikti!` : 'Bugün vadesi doldu!',
    };
  }

  const days = Math.floor(diffMs / MS_PER_DAY);
  const hours = Math.floor((diffMs % MS_PER_DAY) / (60 * 60 * 1000));

  return {
    days,
    hours,
    isOverdue: false,
    text: `${days} gün ${hours} saat kaldı`,
  };
}

export function getDailyInterestAmount(
  principal: number,
  rate: number = DEFAULT_DAILY_INTEREST_RATE
): number {
  return Math.round(principal * (rate / 100));
}

export function getWeeklyInterestObligation(
  principal: number,
  rate: number = DEFAULT_DAILY_INTEREST_RATE
): number {
  return Math.round(principal * (rate / 100) * 7);
}

/**
 * Checks if a member has permission to withdraw bankroll funds.
 * Members can withdraw only if they have no debt OR their debt was forgiven by Patron.
 */
export function canMemberWithdraw(
  debt: VaultDebtInfo,
  isPatron: boolean = false
): { allowed: boolean; reason?: string } {
  if (isPatron) return { allowed: true };
  const totalDebt = (debt.principal || 0) + (debt.accruedInterest || 0);
  if (totalDebt <= 0 || debt.debtForgivenByPatron) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Aktif kasa borcunuz ($${totalDebt.toLocaleString('tr-TR')}) bulunmaktadır. Tüzük gereği borçlu üyeler para çekemez. Para çekebilmek için ya borcunuzu ödemeniz ya da VIP Patron PasHa'nın borcunuzu affetmesi gerekmektedir!`,
  };
}

/**
 * Patron clears and forgives all debt for members, unlocking withdrawal rights.
 */
export function forgiveAllDebt(currentDebt: VaultDebtInfo): VaultDebtInfo {
  return {
    ...currentDebt,
    principal: 0,
    accruedInterest: 0,
    borrowedAt: 0,
    weeklyDueDate: 0,
    debtForgivenByPatron: true,
    forgivenAt: Date.now(),
  };
}
