import React, { useState } from 'react';
import {
  X,
  Crown,
  AlertTriangle,
  Clock,
  DollarSign,
  Plus,
  MinusCircle,
  Sparkles,
  Percent,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  FastForward,
  Info,
  Calculator,
  ArrowDownToLine,
  Send,
  Lock,
  Unlock,
  Coins,
  History,
} from 'lucide-react';
import { isVipManager, VaultDebtInfo, MAX_MEMBER_DEBT } from '../types';
import { sound } from '../utils/audio';
import { CasinoNumpadModal } from './CasinoNumpad';
import {
  getRemainingDaysUntilWeeklyDue,
  getDailyInterestAmount,
  getWeeklyInterestObligation,
  canMemberWithdraw,
} from '../utils/debtHelper';

interface VipVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankroll: number;
  onUpdateBankroll: (delta: number) => void;
  onSetBankroll?: (newAmount: number) => void;
  playerName: string;
  onSwitchToPasha: () => void;
  onOpenProfile: () => void;
  debtInfo: VaultDebtInfo;
  onBorrow: (amount: number) => void;
  onRepay: (amount: number) => void;
  onSimulateDay: () => void;
  onResetDebt?: () => void;
}

type ModalTab = 'borrow' | 'repay' | 'withdraw' | 'pasha_patron';

export const VipVaultModal: React.FC<VipVaultModalProps> = ({
  isOpen,
  onClose,
  bankroll,
  onUpdateBankroll,
  onSetBankroll,
  playerName,
  onSwitchToPasha,
  onOpenProfile,
  debtInfo,
  onBorrow,
  onRepay,
  onSimulateDay,
  onResetDebt,
}) => {
  const isAuthorizedPatron = isVipManager(playerName);
  const totalDebt = (debtInfo.principal || 0) + (debtInfo.accruedInterest || 0);
  const hasActiveDebt = totalDebt > 0;

  // Remaining borrow limit for members (Max 100.000.000)
  const remainingMemberLimit = isAuthorizedPatron
    ? Number.MAX_SAFE_INTEGER
    : Math.max(0, MAX_MEMBER_DEBT - totalDebt);

  // Tabs
  const [activeTab, setActiveTab] = useState<ModalTab>(() => {
    if (isAuthorizedPatron && totalDebt === 0) return 'pasha_patron';
    return hasActiveDebt ? 'repay' : 'borrow';
  });

  // Borrow state
  const [borrowAmount, setBorrowAmount] = useState<number>(5000);
  const [borrowInput, setBorrowInput] = useState<string>('5000');

  // Repay state
  const [repayCustomInput, setRepayCustomInput] = useState<string>('');

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState<number>(() => Math.min(bankroll, 10000));
  const [withdrawInput, setWithdrawInput] = useState<string>(() => Math.min(bankroll, 10000).toString());

  // Patron direct reserve add state
  const [patronAmount, setPatronAmount] = useState<number>(1000000000);
  const [patronInput, setPatronInput] = useState<string>('1000000000');

  // Patron manual transfer to members state
  const [transferRecipient, setTransferRecipient] = useState<string>(
    playerName.trim().toLowerCase() === 'pasha' ? 'VIP Kulüp Üyesi' : playerName
  );
  const [transferAmount, setTransferAmount] = useState<number>(10000000);
  const [transferInput, setTransferInput] = useState<string>('10000000');
  const [transferHistory, setTransferHistory] = useState<
    Array<{ id: string; recipient: string; amount: number; time: string }>
  >(() => {
    try {
      const saved = localStorage.getItem('casino_patron_transfers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Numpad Modal State
  const [numpadConfig, setNumpadConfig] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    initialValue: string | number;
    bankroll: number;
    unlimitedMax?: boolean;
    onConfirm: (num: number) => void;
  }>({
    isOpen: false,
    title: 'Manuel Tutar',
    subtitle: 'Miktarı tuşlayın',
    initialValue: '',
    bankroll: 10000000,
    unlimitedMax: false,
    onConfirm: () => {},
  });

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      [
        'Backspace',
        'Delete',
        'Tab',
        'Escape',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ].includes(e.key) ||
      ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase()))
    ) {
      return;
    }
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'warn' | 'error' } | null>(null);

  if (!isOpen) return null;

  const showNotification = (text: string, type: 'success' | 'warn' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // Remaining weekly due time calculation
  const weeklyDueStatus = getRemainingDaysUntilWeeklyDue(
    debtInfo.weeklyDueDate,
    debtInfo.simulatedDaysElapsed || 0
  );

  const previewDailyInterest = getDailyInterestAmount(borrowAmount, debtInfo.dailyRatePercent);
  const previewWeeklyInterest = getWeeklyInterestObligation(borrowAmount, debtInfo.dailyRatePercent);

  // Withdrawal authorization check
  const withdrawalStatus = canMemberWithdraw(debtInfo, isAuthorizedPatron);

  // Handle Borrow
  const handleConfirmBorrow = () => {
    if (borrowAmount <= 0) {
      showNotification('Lütfen geçerli bir borç miktarı girin.', 'warn');
      return;
    }

    // Check maximum member debt rule (100.000.000$)
    if (!isAuthorizedPatron && totalDebt + borrowAmount > MAX_MEMBER_DEBT) {
      sound.playLose();
      showNotification(
        `Üyeler için maksimum borç limiti $100.000.000'dır! Mevcut borcunuz: $${totalDebt.toLocaleString('tr-TR')}. Kalan kredi limitiniz: $${remainingMemberLimit.toLocaleString('tr-TR')}. Fazlası için VIP Patron PasHa'nın manuel fon/hibe göndermesi gerekmektedir.`,
        'error'
      );
      return;
    }

    sound.playWin();
    onBorrow(borrowAmount);
    showNotification(
      `Kasadan $${borrowAmount.toLocaleString('tr-TR')} avans/borç çekildi ve bakiyenize aktarıldı. Günlük %${debtInfo.dailyRatePercent} faiz başlamıştır!`,
      'success'
    );
  };

  // Handle Quick Borrow Presets
  const handleSelectBorrowPreset = (amount: number) => {
    sound.playChip();
    const effective = isAuthorizedPatron ? amount : Math.min(remainingMemberLimit, amount);
    setBorrowAmount(effective);
    setBorrowInput(effective.toString());
  };

  // Handle Repay full or partial
  const handleRepayAmount = (amountToPay: number) => {
    if (amountToPay <= 0) return;
    if (bankroll < amountToPay) {
      sound.playLose();
      showNotification(
        `Yetersiz bakiye! Mevcut bakiyeniz: $${bankroll.toLocaleString('tr-TR')}, gereken: $${amountToPay.toLocaleString('tr-TR')}`,
        'error'
      );
      return;
    }

    sound.playChip();
    onRepay(amountToPay);
    showNotification(
      `Kasaya $${amountToPay.toLocaleString('tr-TR')} borç/faiz ödemesi başarıyla yapıldı.`,
      'success'
    );
    setRepayCustomInput('');
  };

  // Handle Member Cash Out / Withdrawal
  const handleConfirmWithdraw = () => {
    if (!withdrawalStatus.allowed) {
      sound.playLose();
      showNotification(withdrawalStatus.reason || 'Borcunuz varken para çekemezsiniz!', 'error');
      return;
    }

    const parsed = parseInt(withdrawInput.replace(/[^0-9]/g, ''), 10) || withdrawAmount;
    if (parsed <= 0) {
      showNotification('Lütfen geçerli bir çekim tutarı yazın.', 'warn');
      return;
    }
    if (parsed > bankroll) {
      sound.playLose();
      showNotification(
        `Yetersiz bakiye! Çekmek istediğiniz: $${parsed.toLocaleString('tr-TR')}, mevcut bakiyeniz: $${bankroll.toLocaleString('tr-TR')}`,
        'error'
      );
      return;
    }

    sound.playWin();
    onUpdateBankroll(-parsed);
    showNotification(
      `✅ Nakit Çekim Başarılı! Kasadan $${parsed.toLocaleString('tr-TR')} nakit çekildi. Kalan bakiyeniz: $${(bankroll - parsed).toLocaleString('tr-TR')}`,
      'success'
    );
    setWithdrawAmount(Math.min(bankroll - parsed, 10000));
    setWithdrawInput(Math.min(bankroll - parsed, 10000).toString());
  };

  // Handle Patron Direct Injection (NO MAXIMUM LIMIT)
  const handlePatronDeposit = () => {
    if (!isAuthorizedPatron) return;
    const parsed = parseInt(patronInput.replace(/[^0-9]/g, ''), 10) || patronAmount;
    if (parsed <= 0) return;
    sound.playWin();
    onUpdateBankroll(parsed);
    showNotification(
      `+$${parsed.toLocaleString('tr-TR')} VIP Patron Rezervi Doğrudan Kasaya Eklendi! (Limitsiz Takviye Onaylandı)`,
      'success'
    );
  };

  // Handle 1.000.000.000 $ Dedicated Reserve Injection
  const handleAddBillionReserve = () => {
    if (!isAuthorizedPatron) return;
    const ONE_BILLION = 1_000_000_000;
    sound.playWin();
    onUpdateBankroll(ONE_BILLION);
    setPatronAmount(ONE_BILLION);
    setPatronInput('1000000000');
    showNotification(
      `+$1.000.000.000 (1 Milyar $) VIP Patron Rezervi Başarıyla Kasaya Eklendi!`,
      'success'
    );
  };

  // Handle Patron Manual Fund Grant/Transfer to Members (Exceeding 100M Debt Limit)
  const handleSendFundsToMember = () => {
    if (!isAuthorizedPatron) return;
    const parsed = parseInt(transferInput.replace(/[^0-9]/g, ''), 10) || transferAmount;
    if (parsed <= 0) {
      showNotification('Lütfen geçerli bir hibe/transfer tutarı girin.', 'warn');
      return;
    }
    const cleanRecipient = transferRecipient.trim() || 'Kulüp Üyesi';

    sound.playWin();

    // Directly credit funds to current user or active member
    onUpdateBankroll(parsed);

    const newLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipient: cleanRecipient,
      amount: parsed,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };
    const updatedLogs = [newLog, ...transferHistory.slice(0, 9)];
    setTransferHistory(updatedLogs);
    try {
      localStorage.setItem('casino_patron_transfers', JSON.stringify(updatedLogs));
    } catch {}

    showNotification(
      `👑 VIP Patron PasHa, "${cleanRecipient}" üyesine $${parsed.toLocaleString('tr-TR')} karşılıksız fon aktardı! (Borçlandırmaz, Üye Kredi Limitini Etkilemez)`,
      'success'
    );
  };

  // Handle Patron Forgiving Debts
  const handleForgiveDebts = () => {
    if (!isAuthorizedPatron || !onResetDebt) return;
    sound.playWin();
    onResetDebt();
    showNotification(
      '👑 VIP Patron PasHa: Üyenin tüm kasa borçları ve faizleri affedildi! Para çekme blokajı derhal kaldırıldı.',
      'success'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div
        id="vip-vault-modal-card"
        className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-amber-500/50 p-5 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden my-auto"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 35px rgba(245, 158, 11, 0.25)',
        }}
      >
        {/* Ambient Glows */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="close-vault-modal-btn"
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title & Identity */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-900 p-0.5 shadow-lg flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Crown className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            </div>
          </div>
          <div>
            <h3 className="font-serif-luxury font-black text-xl sm:text-2xl text-amber-200 tracking-wide">
              GRAND ROYALE VIP KASA & KREDİ FONU
            </h3>
            <p className="text-xs text-slate-400">
              Maksimum $100M Üye Kredi Limiti • Patron Fon Transferi • Nakit Çekim Protokolü
            </p>
          </div>
        </div>

        {/* Financial Summary Top Card */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-4">
          {/* Current Bankroll */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-inner">
            <span className="text-[10px] sm:text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
              Oynanabilir Bakiye
            </span>
            <span className="font-serif-luxury font-black text-xl sm:text-2xl text-amber-200 truncate block">
              ${bankroll.toLocaleString('tr-TR')}
            </span>
          </div>

          {/* Active Debt */}
          <div
            className={`p-3 sm:p-3.5 rounded-2xl border shadow-inner ${
              hasActiveDebt
                ? 'bg-red-950/40 border-red-500/50'
                : 'bg-slate-900/90 border-slate-700/60'
            }`}
          >
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider block flex items-center justify-between text-red-400">
              <span>Toplam Kasa Borcu</span>
              {hasActiveDebt && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 font-bold">%5 Faiz</span>
              )}
            </span>
            <span
              className={`font-serif-luxury font-black text-xl sm:text-2xl truncate block ${
                hasActiveDebt ? 'text-red-300' : 'text-slate-400'
              }`}
            >
              ${totalDebt.toLocaleString('tr-TR')}
            </span>
          </div>

          {/* Player Badge & Withdrawal Status */}
          <div className="col-span-2 sm:col-span-1 p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/20 flex flex-col justify-center">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Yetki & Çekim İzni
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isAuthorizedPatron ? (
                <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              ) : withdrawalStatus.allowed ? (
                <Unlock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              )}
              <span className="font-serif-luxury font-bold text-sm text-slate-100 truncate">
                {playerName || 'Üye'}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ml-auto flex-shrink-0 ${
                  isAuthorizedPatron
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : withdrawalStatus.allowed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                {isAuthorizedPatron
                  ? 'VIP Patron'
                  : withdrawalStatus.allowed
                  ? 'Çekim Serbest'
                  : 'Çekim Kilitli'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-amber-500/30 mb-4 overflow-x-auto">
          <button
            id="tab-borrow-btn"
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('borrow');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl font-serif-luxury font-bold text-xs tracking-wide transition flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'borrow'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-amber-300 hover:bg-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Borç Çek (Maks $100M)
          </button>

          <button
            id="tab-repay-btn"
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('repay');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl font-serif-luxury font-bold text-xs tracking-wide transition relative flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'repay'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-amber-300 hover:bg-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Borç & Faiz
            {hasActiveDebt && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute top-1.5 right-1.5" />
            )}
          </button>

          <button
            id="tab-withdraw-btn"
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('withdraw');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl font-serif-luxury font-bold text-xs tracking-wide transition relative flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'withdraw'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-md'
                : 'text-emerald-400 hover:text-emerald-200 hover:bg-emerald-950/40'
            }`}
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            Para Çek (Nakit)
            {!withdrawalStatus.allowed && <Lock className="w-3 h-3 text-red-400 ml-0.5" />}
          </button>

          {isAuthorizedPatron && (
            <button
              id="tab-patron-btn"
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab('pasha_patron');
              }}
              className={`py-2 px-3 rounded-xl font-serif-luxury font-bold text-xs tracking-wide transition flex items-center justify-center gap-1 whitespace-nowrap ${
                activeTab === 'pasha_patron'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 shadow-md'
                  : 'text-amber-400 hover:text-amber-200 hover:bg-amber-950/40'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Patron Masası
            </button>
          )}
        </div>

        {/* FEEDBACK ALERT */}
        {feedback && (
          <div
            className={`p-3 rounded-2xl mb-4 text-xs font-bold text-center border animate-bounce ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                : feedback.type === 'error'
                ? 'bg-red-950/80 border-red-500/60 text-red-300'
                : 'bg-amber-950/80 border-amber-500/60 text-amber-300'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* TAB 1: KASADAN BORÇ / AVANS ÇEK (MAX 100.000.000 $) */}
        {activeTab === 'borrow' && (
          <div className="space-y-3.5">
            {/* 100.000.000 $ Limit & Warning Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/70 via-slate-900 to-amber-950/60 border-2 border-red-500/60 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-red-500/20 text-red-400 flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1 w-full">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif-luxury font-black text-xs sm:text-sm text-red-300 tracking-wide">
                      ÜYE KREDİ LİMİTİ: $100.000.000 (100 MİLYON DOLAR)
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      Günlük %{debtInfo.dailyRatePercent} Faiz
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-200 leading-relaxed font-medium">
                    Grand Royale tüzüğü uyarınca bir üyenin alabileceği maksimum borç tutarı <strong className="text-amber-300 font-black">$100.000.000</strong>'dır. 100M$ üzerindeki tutarlar için VIP Patron PasHa'nın manuel fon göndermesi gerekmektedir.
                  </p>

                  {/* Limit Usage Progress Bar */}
                  <div className="pt-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-300 mb-1">
                      <span>Kullanılan Kredi: ${totalDebt.toLocaleString('tr-TR')}</span>
                      <span className="font-bold text-amber-300">
                        Kalan Hak: ${remainingMemberLimit.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                      <div
                        className={`h-full transition-all duration-500 ${
                          totalDebt >= MAX_MEMBER_DEBT
                            ? 'bg-red-500'
                            : totalDebt >= 50_000_000
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (totalDebt / MAX_MEMBER_DEBT) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Select Borrow Amount Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  Çekmek İstediğiniz Avans Tutarı ($)
                </label>
                <span className="text-[11px] text-slate-400">
                  Kalan Kredi: ${remainingMemberLimit.toLocaleString('tr-TR')}
                </span>
              </div>

              <div className="relative">
                <input
                  id="borrow-amount-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={borrowInput}
                  onClick={() =>
                    setNumpadConfig({
                      isOpen: true,
                      title: 'Avans Tutarı Belirle',
                      subtitle: `Maksimum kalan kredi limitiniz: $${remainingMemberLimit.toLocaleString('tr-TR')}`,
                      initialValue: borrowInput,
                      bankroll: remainingMemberLimit,
                      unlimitedMax: isAuthorizedPatron,
                      onConfirm: (num) => {
                        const clamped = isAuthorizedPatron ? num : Math.min(remainingMemberLimit, num);
                        setBorrowAmount(clamped);
                        setBorrowInput(clamped > 0 ? clamped.toString() : '');
                      },
                    })
                  }
                  onFocus={() =>
                    setNumpadConfig({
                      isOpen: true,
                      title: 'Avans Tutarı Belirle',
                      subtitle: `Maksimum kalan kredi limitiniz: $${remainingMemberLimit.toLocaleString('tr-TR')}`,
                      initialValue: borrowInput,
                      bankroll: remainingMemberLimit,
                      unlimitedMax: isAuthorizedPatron,
                      onConfirm: (num) => {
                        const clamped = isAuthorizedPatron ? num : Math.min(remainingMemberLimit, num);
                        setBorrowAmount(clamped);
                        setBorrowInput(clamped > 0 ? clamped.toString() : '');
                      },
                    })
                  }
                  onKeyDown={handleNumericKeyDown}
                  onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData('text').replace(/\D/g, '');
                    const parsed = parseInt(text, 10);
                    const clamped = isAuthorizedPatron ? parsed : Math.min(remainingMemberLimit, parsed || 0);
                    setBorrowInput(clamped > 0 ? clamped.toString() : '');
                    setBorrowAmount(clamped);
                  }}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    const parsed = parseInt(val, 10) || 0;
                    const clamped = isAuthorizedPatron ? parsed : Math.min(remainingMemberLimit, parsed);
                    setBorrowInput(clamped > 0 ? clamped.toString() : '');
                    setBorrowAmount(clamped);
                  }}
                  placeholder="0"
                  className="w-full pl-8 pr-32 py-3 rounded-2xl bg-slate-900 border-2 border-amber-500/60 text-amber-100 font-serif-luxury font-black text-xl tracking-wider focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/20 shadow-inner cursor-pointer"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-serif-luxury font-black text-lg select-none">
                  $
                </span>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setNumpadConfig({
                        isOpen: true,
                        title: 'Avans Tutarı Belirle',
                        subtitle: `Maksimum kalan kredi limitiniz: $${remainingMemberLimit.toLocaleString('tr-TR')}`,
                        initialValue: borrowInput,
                        bankroll: remainingMemberLimit,
                        unlimitedMax: isAuthorizedPatron,
                        onConfirm: (num) => {
                          const clamped = isAuthorizedPatron ? num : Math.min(remainingMemberLimit, num);
                          setBorrowAmount(clamped);
                          setBorrowInput(clamped > 0 ? clamped.toString() : '');
                        },
                      })
                    }
                    className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center gap-1"
                    title="Numpad Aç"
                  >
                    <Calculator className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.min(remainingMemberLimit, borrowAmount + 1000000);
                      setBorrowAmount(next);
                      setBorrowInput(next.toString());
                      sound.playChip();
                    }}
                    className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition"
                  >
                    +1M
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.min(remainingMemberLimit, borrowAmount + 10000000);
                      setBorrowAmount(next);
                      setBorrowInput(next.toString());
                      sound.playChip();
                    }}
                    className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition"
                  >
                    +10M
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Borrow Presets */}
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Hızlı Kredi Paketleri (Maks $100M):
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  { label: '$100K', val: 100000 },
                  { label: '$1M', val: 1000000 },
                  { label: '$5M', val: 5000000 },
                  { label: '$10M', val: 10000000 },
                  { label: '$50M', val: 50000000 },
                  { label: '$100M', val: 100000000 },
                ].map((preset) => {
                  const isDisabled = !isAuthorizedPatron && preset.val > remainingMemberLimit;
                  return (
                    <button
                      key={preset.val}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleSelectBorrowPreset(preset.val)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition border ${
                        borrowAmount === preset.val
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105'
                          : isDisabled
                          ? 'bg-slate-950 text-slate-600 border-slate-800 opacity-50 cursor-not-allowed'
                          : 'bg-slate-900/80 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interest Breakdown preview */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-amber-500/25 grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Günlük Faiz Oranı</span>
                <span className="font-serif-luxury font-bold text-xs sm:text-sm text-amber-300">
                  %{debtInfo.dailyRatePercent} / Gün
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Günlük Tahakkuk</span>
                <span className="font-serif-luxury font-bold text-xs sm:text-sm text-red-300">
                  +${previewDailyInterest.toLocaleString('tr-TR')} / gün
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block font-medium">Haftalık Zorunlu Faiz</span>
                <span className="font-serif-luxury font-bold text-xs sm:text-sm text-amber-200">
                  ${previewWeeklyInterest.toLocaleString('tr-TR')} / hafta
                </span>
              </div>
            </div>

            {/* Borrow Action Button */}
            <button
              id="confirm-borrow-btn"
              type="button"
              onClick={handleConfirmBorrow}
              disabled={borrowAmount <= 0 || (!isAuthorizedPatron && remainingMemberLimit <= 0)}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-slate-950 font-serif-luxury font-black text-sm uppercase tracking-wider shadow-[0_4px_25px_rgba(245,158,11,0.4)] active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <DollarSign className="w-5 h-5 text-slate-950 stroke-[3]" />
              Kasadan ${borrowAmount.toLocaleString('tr-TR')} Borç Çek (Şartları Kabul Et)
            </button>
          </div>
        )}

        {/* TAB 2: BORÇ DURUMU & ÖDEME */}
        {activeTab === 'repay' && (
          <div className="space-y-3.5">
            {/* Patron Forgiven Banner */}
            {debtInfo.debtForgivenByPatron && !hasActiveDebt && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500/70 text-center space-y-1">
                <div className="flex items-center justify-center gap-2 text-emerald-300 font-serif-luxury font-bold text-sm">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span>VIP PATRON PASHa BORÇLARINIZI AFFETTİ!</span>
                </div>
                <p className="text-xs text-slate-300">
                  Tüm kasa borçlarınız silinmiştir. <strong>"Para Çek (Nakit)"</strong> sekmesinden bakiyenizi serbestçe çekebilirsiniz.
                </p>
              </div>
            )}

            {!hasActiveDebt ? (
              <div className="p-7 rounded-2xl bg-slate-900/60 border border-emerald-500/30 text-center space-y-2.5">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-serif-luxury font-bold text-base sm:text-lg text-emerald-300">
                  Tebrikler, Kasa Borcunuz Bulunmuyor!
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Kasaya hiçbir aktif borcunuz veya ödenmemiş faiz yükümlülüğünüz yoktur. İstediğiniz zaman para çekebilir veya yeni avans alabilirsiniz.
                </p>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('borrow')}
                    className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-serif-luxury font-bold text-xs uppercase tracking-wider transition"
                  >
                    Yeni Avans / Borç Al
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('withdraw')}
                    className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-serif-luxury font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    Nakit Para Çek
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Active Debt Card */}
                <div className="p-3.5 rounded-2xl bg-slate-900/95 border-2 border-red-500/60 shadow-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <span className="font-serif-luxury font-bold text-sm text-red-300 uppercase tracking-wider">
                        Aktif Borç Dosyası
                      </span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                      Günlük %{debtInfo.dailyRatePercent} Faiz İşliyor
                    </span>
                  </div>

                  {/* Detailed Table */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-black/50 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Ana Para Borcu</span>
                      <span className="font-serif-luxury font-bold text-base text-slate-100">
                        ${debtInfo.principal.toLocaleString('tr-TR')}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/50 border border-red-500/30">
                      <span className="text-[10px] text-red-400 block font-semibold">Biriken Günlük Faiz</span>
                      <span className="font-serif-luxury font-bold text-base text-red-300">
                        +${debtInfo.accruedInterest.toLocaleString('tr-TR')}
                      </span>
                    </div>

                    <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-black/50 border border-amber-500/40">
                      <span className="text-[10px] text-amber-400 block font-semibold">Toplam Kapatma Tutarı</span>
                      <span className="font-serif-luxury font-black text-base text-amber-200">
                        ${totalDebt.toLocaleString('tr-TR')}
                      </span>
                    </div>
                  </div>

                  {/* Weekly Due Alert Box */}
                  <div
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      weeklyDueStatus.isOverdue
                        ? 'bg-red-950/80 border-red-500 text-red-200'
                        : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock
                        className={`w-4 h-4 flex-shrink-0 ${
                          weeklyDueStatus.isOverdue ? 'text-red-400 animate-pulse' : 'text-amber-400'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-bold">
                          Haftalık Faiz Vadesi: {weeklyDueStatus.text}
                        </div>
                        <div className="text-[10px] text-slate-300">
                          Haftalık faiz ödenmediğinde ana paraya eklenir. Borcu olanlar para çekemez!
                        </div>
                      </div>
                    </div>

                    {/* Simulation test button */}
                    <button
                      id="simulate-day-btn"
                      type="button"
                      onClick={() => {
                        sound.playChip();
                        onSimulateDay();
                        showNotification(
                          `Simülasyon: +1 gün ilerletildi! Günlük %${debtInfo.dailyRatePercent} faiz ($${getDailyInterestAmount(
                            debtInfo.principal,
                            debtInfo.dailyRatePercent
                          ).toLocaleString('tr-TR')}) borca eklendi.`,
                          'warn'
                        );
                      }}
                      title="Günü 1 gün ilerleterek faiz tahakkukunu test edin"
                      className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[11px] font-semibold text-slate-200 flex items-center gap-1 transition active:scale-95"
                    >
                      <FastForward className="w-3.5 h-3.5 text-amber-400" />
                      <span>+1 Gün</span>
                    </button>
                  </div>
                </div>

                {/* Repayment Options */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MinusCircle className="w-4 h-4" />
                    Borç Geri Ödeme Seçenekleri
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Pay Accrued Interest Only */}
                    {debtInfo.accruedInterest > 0 && (
                      <button
                        id="repay-interest-only-btn"
                        type="button"
                        onClick={() => handleRepayAmount(debtInfo.accruedInterest)}
                        className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-red-500/50 text-left transition group active:scale-95"
                      >
                        <div className="text-xs font-bold text-red-300 flex items-center justify-between">
                          <span>Sadece Biriken Faizi Öde</span>
                          <span className="text-amber-300 font-serif-luxury font-black">
                            ${debtInfo.accruedInterest.toLocaleString('tr-TR')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Haftalık faiz yükümlülüğünüzü kapatır.
                        </p>
                      </button>
                    )}

                    {/* Pay Full Outstanding Debt */}
                    <button
                      id="repay-full-btn"
                      type="button"
                      onClick={() => handleRepayAmount(totalDebt)}
                      className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/80 to-slate-900 hover:from-emerald-900/80 border border-emerald-500/50 text-left transition group active:scale-95"
                    >
                      <div className="text-xs font-bold text-emerald-300 flex items-center justify-between">
                        <span>Tüm Borcu Kapat & Çekim İzni Al</span>
                        <span className="text-emerald-200 font-serif-luxury font-black text-sm">
                          ${totalDebt.toLocaleString('tr-TR')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Tüm borcu sıfırlar ve nakit çekim kilidini açar.
                      </p>
                    </button>
                  </div>

                  {/* Partial Repayment Custom Input */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        id="repay-custom-amount-input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={repayCustomInput}
                        onClick={() =>
                          setNumpadConfig({
                            isOpen: true,
                            title: 'Kısmi Borç Ödeme',
                            subtitle: 'Ödemek istediğiniz tutarı tuşlayın',
                            initialValue: repayCustomInput,
                            bankroll: Math.min(bankroll, totalDebt),
                            onConfirm: (num) => {
                              setRepayCustomInput(num > 0 ? num.toString() : '');
                            },
                          })
                        }
                        onFocus={() =>
                          setNumpadConfig({
                            isOpen: true,
                            title: 'Kısmi Borç Ödeme',
                            subtitle: 'Ödemek istediğiniz tutarı tuşlayın',
                            initialValue: repayCustomInput,
                            bankroll: Math.min(bankroll, totalDebt),
                            onConfirm: (num) => {
                              setRepayCustomInput(num > 0 ? num.toString() : '');
                            },
                          })
                        }
                        onKeyDown={handleNumericKeyDown}
                        onPaste={(e) => {
                          e.preventDefault();
                          const text = e.clipboardData.getData('text').replace(/\D/g, '');
                          setRepayCustomInput(text);
                        }}
                        onChange={(e) => setRepayCustomInput(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Kısmi ödeme tutarı yazın..."
                        className="w-full pl-7 pr-10 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 font-serif-luxury font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs select-none">
                        $
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setNumpadConfig({
                            isOpen: true,
                            title: 'Kısmi Borç Ödeme',
                            subtitle: 'Ödemek istediğiniz tutarı tuşlayın',
                            initialValue: repayCustomInput,
                            bankroll: Math.min(bankroll, totalDebt),
                            onConfirm: (num) => {
                              setRepayCustomInput(num > 0 ? num.toString() : '');
                            },
                          })
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-300 p-1"
                        title="Numpad Aç"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const amount = parseInt(repayCustomInput, 10);
                        if (!isNaN(amount) && amount > 0) {
                          handleRepayAmount(amount);
                        }
                      }}
                      className="py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition active:scale-95 flex-shrink-0"
                    >
                      Kısmi Öde
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PARA ÇEK (NAKİT ÇEKİM / CASH OUT) */}
        {activeTab === 'withdraw' && (
          <div className="space-y-3.5">
            {/* Withdrawal Status Box */}
            {!withdrawalStatus.allowed ? (
              <div className="p-4 rounded-2xl bg-red-950/80 border-2 border-red-500 shadow-xl space-y-2.5 text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-serif-luxury font-black text-sm sm:text-base text-red-300 uppercase tracking-wider">
                    🚫 PARA ÇEKME KİLİTLİ: AKTİF KASA BORCU BULUNUYOR
                  </h4>
                  <p className="text-xs text-red-200/90 mt-1 max-w-md mx-auto leading-relaxed">
                    Kasaya toplam <strong className="text-amber-300 font-black">${totalDebt.toLocaleString('tr-TR')}</strong> ödenmemiş borcunuz bulunmaktadır. Tüzük gereğince borçlu üyelerin nakit çekmesi yasaktır!
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-red-500/40 text-xs text-slate-200 text-left space-y-1.5">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Para Çekme İzni Nasıl Açılır?</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                    <li>
                      <strong>1. Seçenek:</strong> "Borç & Faiz" sekmesinden mevcut ${totalDebt.toLocaleString('tr-TR')} borcun tamamını kapatın.
                    </li>
                    <li>
                      <strong>2. Seçenek:</strong> VIP Patron PasHa'nın borçlarınızı <u>affetmesi halinde</u> derhal para çekebilirsiniz.
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('repay')}
                    className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-serif-luxury font-bold text-xs uppercase tracking-wider transition active:scale-95"
                  >
                    Borcu Öde ve Kilidi Aç
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-emerald-950/70 border-2 border-emerald-500/70 shadow-lg flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                    <Unlock className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-serif-luxury font-bold text-xs sm:text-sm text-emerald-300">
                      ✅ NAKİT ÇEKİM İZNİ AKTİF ({debtInfo.debtForgivenByPatron ? 'PATRON AFFI İLE ONAYLANDI' : 'BORÇSUZ KASA'})
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      {debtInfo.debtForgivenByPatron
                        ? 'VIP Patron PasHa borçlarınızı affettiği için nakit çekim izniniz açık durumdadır.'
                        : 'Aktif kasa borcunuz bulunmadığından bakiyenizi serbestçe nakit olarak çekebilirsiniz.'}
                    </p>
                  </div>
                </div>

                {/* Withdraw Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                      Çekmek İstediğiniz Nakit Tutarı ($)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Mevcut Bakiye: ${bankroll.toLocaleString('tr-TR')}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      id="withdraw-amount-input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={withdrawInput}
                      onClick={() =>
                        setNumpadConfig({
                          isOpen: true,
                          title: 'Nakit Çekim Tutarı',
                          subtitle: `Çekilebilir maksimum bakiye: $${bankroll.toLocaleString('tr-TR')}`,
                          initialValue: withdrawInput,
                          bankroll: bankroll,
                          onConfirm: (num) => {
                            const clamped = Math.min(bankroll, num);
                            setWithdrawAmount(clamped);
                            setWithdrawInput(clamped > 0 ? clamped.toString() : '');
                          },
                        })
                      }
                      onFocus={() =>
                        setNumpadConfig({
                          isOpen: true,
                          title: 'Nakit Çekim Tutarı',
                          subtitle: `Çekilebilir maksimum bakiye: $${bankroll.toLocaleString('tr-TR')}`,
                          initialValue: withdrawInput,
                          bankroll: bankroll,
                          onConfirm: (num) => {
                            const clamped = Math.min(bankroll, num);
                            setWithdrawAmount(clamped);
                            setWithdrawInput(clamped > 0 ? clamped.toString() : '');
                          },
                        })
                      }
                      onKeyDown={handleNumericKeyDown}
                      onPaste={(e) => {
                        e.preventDefault();
                        const text = e.clipboardData.getData('text').replace(/\D/g, '');
                        const parsed = parseInt(text, 10) || 0;
                        const clamped = Math.min(bankroll, parsed);
                        setWithdrawInput(clamped > 0 ? clamped.toString() : '');
                        setWithdrawAmount(clamped);
                      }}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        const parsed = parseInt(val, 10) || 0;
                        const clamped = Math.min(bankroll, parsed);
                        setWithdrawInput(clamped > 0 ? clamped.toString() : '');
                        setWithdrawAmount(clamped);
                      }}
                      placeholder="0"
                      className="w-full pl-8 pr-12 py-3 rounded-2xl bg-slate-900 border-2 border-emerald-500/60 text-emerald-100 font-serif-luxury font-black text-xl tracking-wider focus:outline-none focus:border-emerald-400 cursor-pointer"
                    />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-serif-luxury font-black text-lg select-none">
                      $
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setNumpadConfig({
                          isOpen: true,
                          title: 'Nakit Çekim Tutarı',
                          subtitle: `Çekilebilir maksimum bakiye: $${bankroll.toLocaleString('tr-TR')}`,
                          initialValue: withdrawInput,
                          bankroll: bankroll,
                          onConfirm: (num) => {
                            const clamped = Math.min(bankroll, num);
                            setWithdrawAmount(clamped);
                            setWithdrawInput(clamped > 0 ? clamped.toString() : '');
                          },
                        })
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-300 p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40"
                      title="Numpad Aç"
                    >
                      <Calculator className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Withdraw Buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {[
                    { label: '$100K', val: 100000 },
                    { label: '$1M', val: 1000000 },
                    { label: '$10M', val: 10000000 },
                    { label: '$50M', val: 50000000 },
                    { label: 'Tümünü Çek', val: bankroll },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const clamped = Math.min(bankroll, preset.val);
                        setWithdrawAmount(clamped);
                        setWithdrawInput(clamped.toString());
                        sound.playChip();
                      }}
                      className="py-2 px-1 rounded-xl text-xs font-bold transition border bg-slate-900 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Confirm Withdraw Button */}
                <button
                  id="confirm-withdraw-btn"
                  type="button"
                  onClick={handleConfirmWithdraw}
                  disabled={withdrawAmount <= 0 || withdrawAmount > bankroll}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-serif-luxury font-black text-sm uppercase tracking-wider shadow-[0_4px_25px_rgba(16,185,129,0.4)] active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ArrowDownToLine className="w-5 h-5 stroke-[3]" />
                  Kasadan ${withdrawAmount.toLocaleString('tr-TR')} Nakit Çek
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PASHA PATRON KASASI (ONLY PASHA) */}
        {activeTab === 'pasha_patron' && isAuthorizedPatron && (
          <div className="space-y-4">
            {/* VIP Patron Header Badge */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-900/40 border border-amber-500/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif-luxury font-bold text-sm text-amber-200">
                    VIP Patron Masası: PasHa
                  </h4>
                  <p className="text-xs text-slate-300">
                    Patron olarak limitsiz rezerv ekleyebilir, üyelere karşılıksız fon aktarabilir ve borçları affedebilirsiniz.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 1: 1.000.000.000 $ REZERV EKLE & DOĞRUDAN FON TAKVİYESİ (LİMİTSİZ) */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border-2 border-amber-500/60 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Doğrudan Fon Takviyesi & Rezerv Ekle (Patron İçin Limitsiz)
                </label>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  Limitsiz Giriş
                </span>
              </div>

              {/* DEDICATED 1.000.000.000 $ QUICK RESERVE INJECTION BUTTON */}
              <button
                id="add-one-billion-reserve-btn"
                type="button"
                onClick={handleAddBillionReserve}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-serif-luxury font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.6)] active:scale-95 transition flex items-center justify-center gap-2 border-2 border-amber-200"
              >
                <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.5] animate-spin" style={{ animationDuration: '4s' }} />
                Kasaya +1.000.000.000$ (1 Milyar $) Rezerv Ekle
              </button>

              {/* Input for any custom direct amount (unlimitedMax: true) */}
              <div className="relative">
                <input
                  id="patron-amount-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={patronInput}
                  onClick={() =>
                    setNumpadConfig({
                      isOpen: true,
                      title: 'Patron Rezerv Takviyesi',
                      subtitle: 'Kasaya aktarılacak tutarı tuşlayın (Limitsiz Giriş)',
                      initialValue: patronInput,
                      bankroll: Number.MAX_SAFE_INTEGER,
                      unlimitedMax: true,
                      onConfirm: (num) => {
                        setPatronAmount(num);
                        setPatronInput(num > 0 ? num.toString() : '');
                      },
                    })
                  }
                  onFocus={() =>
                    setNumpadConfig({
                      isOpen: true,
                      title: 'Patron Rezerv Takviyesi',
                      subtitle: 'Kasaya aktarılacak tutarı tuşlayın (Limitsiz Giriş)',
                      initialValue: patronInput,
                      bankroll: Number.MAX_SAFE_INTEGER,
                      unlimitedMax: true,
                      onConfirm: (num) => {
                        setPatronAmount(num);
                        setPatronInput(num > 0 ? num.toString() : '');
                      },
                    })
                  }
                  onKeyDown={handleNumericKeyDown}
                  onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData('text').replace(/\D/g, '');
                    setPatronInput(text);
                    const parsed = parseInt(text, 10);
                    setPatronAmount(!isNaN(parsed) ? parsed : 0);
                  }}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setPatronInput(val);
                    const parsed = parseInt(val, 10);
                    setPatronAmount(!isNaN(parsed) ? parsed : 0);
                  }}
                  className="w-full pl-8 pr-12 py-3 rounded-xl bg-slate-950 border-2 border-amber-500/60 text-amber-100 font-serif-luxury font-black text-lg tracking-wider focus:outline-none focus:border-amber-400 cursor-pointer"
                  placeholder="İstediğiniz tutarı yazın (Maksimum sınır yoktur)..."
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-serif-luxury font-black text-lg select-none">
                  $
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setNumpadConfig({
                      isOpen: true,
                      title: 'Patron Rezerv Takviyesi',
                      subtitle: 'Kasaya aktarılacak tutarı tuşlayın (Limitsiz Giriş)',
                      initialValue: patronInput,
                      bankroll: Number.MAX_SAFE_INTEGER,
                      unlimitedMax: true,
                      onConfirm: (num) => {
                        setPatronAmount(num);
                        setPatronInput(num > 0 ? num.toString() : '');
                      },
                    })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-300 p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40"
                  title="Numpad Aç"
                >
                  <Calculator className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Preset Buttons including 1B */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {[
                  { label: '+$1M', val: 1000000 },
                  { label: '+$10M', val: 10000000 },
                  { label: '+$100M', val: 100000000 },
                  { label: '+$500M', val: 500000000 },
                  { label: '+$1.000.000.000', val: 1000000000 },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPatronAmount(preset.val);
                      setPatronInput(preset.val.toString());
                      sound.playChip();
                    }}
                    className={`py-1.5 px-1 rounded-lg text-xs font-bold transition border ${
                      patronAmount === preset.val
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                        : 'bg-slate-950 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Deposit Written Amount Button */}
              <button
                type="button"
                onClick={handlePatronDeposit}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-serif-luxury font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Yazılan ${patronAmount.toLocaleString('tr-TR')} Tutarı Kasaya Ekle (Limitsiz)
              </button>
            </div>

            {/* SECTION 2: ÜYELERE MANUEL PARA GÖNDERME (100M ÜSTÜ VE HİBE TRANSFERİ) */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-amber-400" />
                  <span className="font-serif-luxury font-bold text-xs sm:text-sm text-amber-300 uppercase tracking-wide">
                    Üyelere Manuel Para Gönder (VIP Fon Hibesi)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Borçlandırmaz</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Üyelerin $100.000.000 borç limitini doldurduğu durumlarda Patron olarak dilediğiniz üyeye doğrudan karşılıksız fon gönderebilirsiniz.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Target member input */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Alıcı Üye Adı:
                  </label>
                  <input
                    type="text"
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                    placeholder="Üye adı yazın..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Transfer amount input */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Gönderilecek Tutar ($):
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={transferInput}
                      onClick={() =>
                        setNumpadConfig({
                          isOpen: true,
                          title: 'Üyeye Fon Gönderme',
                          subtitle: `${transferRecipient || 'Üye'} hesabına aktarılacak tutar (Limitsiz)`,
                          initialValue: transferInput,
                          bankroll: Number.MAX_SAFE_INTEGER,
                          unlimitedMax: true,
                          onConfirm: (num) => {
                            setTransferAmount(num);
                            setTransferInput(num > 0 ? num.toString() : '');
                          },
                        })
                      }
                      onFocus={() =>
                        setNumpadConfig({
                          isOpen: true,
                          title: 'Üyeye Fon Gönderme',
                          subtitle: `${transferRecipient || 'Üye'} hesabına aktarılacak tutar (Limitsiz)`,
                          initialValue: transferInput,
                          bankroll: Number.MAX_SAFE_INTEGER,
                          unlimitedMax: true,
                          onConfirm: (num) => {
                            setTransferAmount(num);
                            setTransferInput(num > 0 ? num.toString() : '');
                          },
                        })
                      }
                      onKeyDown={handleNumericKeyDown}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setTransferInput(val);
                        const parsed = parseInt(val, 10);
                        setTransferAmount(!isNaN(parsed) ? parsed : 0);
                      }}
                      className="w-full pl-6 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-amber-200 font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-amber-400 text-xs font-bold select-none">
                      $
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setNumpadConfig({
                          isOpen: true,
                          title: 'Üyeye Fon Gönderme',
                          subtitle: `${transferRecipient || 'Üye'} hesabına aktarılacak tutar (Limitsiz)`,
                          initialValue: transferInput,
                          bankroll: Number.MAX_SAFE_INTEGER,
                          unlimitedMax: true,
                          onConfirm: (num) => {
                            setTransferAmount(num);
                            setTransferInput(num > 0 ? num.toString() : '');
                          },
                        })
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-300 p-1"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick transfer presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {[
                  { label: '$1M', val: 1000000 },
                  { label: '$10M', val: 10000000 },
                  { label: '$50M', val: 50000000 },
                  { label: '$100M', val: 100000000 },
                  { label: '$1.000.000.000', val: 1000000000 },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTransferAmount(preset.val);
                      setTransferInput(preset.val.toString());
                      sound.playChip();
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold transition border bg-slate-950 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 whitespace-nowrap"
                  >
                    +{preset.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSendFundsToMember}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-serif-luxury font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                "{transferRecipient}" Üyesine ${transferAmount.toLocaleString('tr-TR')} Fon Gönder / Hibe Et
              </button>
            </div>

            {/* SECTION 3: BORÇLARI AFFET / SIFIRLA & ÇEKİM KİLİDİNİ KALDIR */}
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-red-400" />
                  <span className="font-serif-luxury font-bold text-xs sm:text-sm text-red-300 uppercase tracking-wide">
                    Patron Borç Affı & Para Çekme Kilidi Kaldırma
                  </span>
                </div>
                <span className="text-[10px] text-amber-300 font-bold">Tek Tıkla Yetki</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Tüzük gereğince borçlu üyeler para çekemez. Patron olarak üyenin borçlarını affettiğinizde tüm borç dosyaları sıfırlanır ve üyelerin nakit çekim kısıtlamaları derhal kaldırılır.
              </p>

              <button
                type="button"
                onClick={handleForgiveDebts}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-slate-950 font-serif-luxury font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg"
              >
                <Crown className="w-4 h-4 text-slate-950" />
                👑 Üyelerin Tüm Borçlarını Affet & Para Çekme İzni Ver
              </button>
            </div>
          </div>
        )}

        {/* Bottom Hint */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-500/70" />
            <span>Maksimum üye borç limiti: $100.000.000 • Faiz her gün saat 00:00'da işlenir.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
              onOpenProfile();
            }}
            className="text-amber-400 hover:text-amber-200 underline font-medium"
          >
            Profil / Üye Ayarları
          </button>
        </div>
      </div>

      {/* Embedded Numpad Modal for VipVault */}
      <CasinoNumpadModal
        isOpen={numpadConfig.isOpen}
        onClose={() => setNumpadConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={(val) => {
          numpadConfig.onConfirm(val);
          setNumpadConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        title={numpadConfig.title}
        subtitle={numpadConfig.subtitle}
        initialValue={numpadConfig.initialValue}
        bankroll={numpadConfig.bankroll}
        unlimitedMax={numpadConfig.unlimitedMax}
      />
    </div>
  );
};
