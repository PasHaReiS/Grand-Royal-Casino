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
} from 'lucide-react';
import { isVipManager, VaultDebtInfo } from '../types';
import { sound } from '../utils/audio';
import { CasinoNumpadModal } from './CasinoNumpad';
import {
  getRemainingDaysUntilWeeklyDue,
  getDailyInterestAmount,
  getWeeklyInterestObligation
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

type ModalTab = 'borrow' | 'repay' | 'pasha_patron';

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

  // Tabs: default to 'borrow' or 'repay' if has debt
  const [activeTab, setActiveTab] = useState<ModalTab>(() => {
    if (isAuthorizedPatron && totalDebt === 0) return 'pasha_patron';
    return hasActiveDebt ? 'repay' : 'borrow';
  });

  // Borrow state
  const [borrowAmount, setBorrowAmount] = useState<number>(5000);
  const [borrowInput, setBorrowInput] = useState<string>('5000');

  // Repay state
  const [repayCustomInput, setRepayCustomInput] = useState<string>('');

  // Patron direct add state
  const [patronAmount, setPatronAmount] = useState<number>(10000);
  const [patronInput, setPatronInput] = useState<string>('10000');

  // Numpad Modal State
  const [numpadConfig, setNumpadConfig] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    initialValue: string | number;
    bankroll: number;
    onConfirm: (num: number) => void;
  }>({
    isOpen: false,
    title: 'Manuel Tutar',
    subtitle: 'Miktarı tuşlayın',
    initialValue: '',
    bankroll: 10000000,
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
    }, 3500);
  };

  // Remaining weekly due time calculation
  const weeklyDueStatus = getRemainingDaysUntilWeeklyDue(
    debtInfo.weeklyDueDate,
    debtInfo.simulatedDaysElapsed || 0
  );

  const previewDailyInterest = getDailyInterestAmount(borrowAmount, debtInfo.dailyRatePercent);
  const previewWeeklyInterest = getWeeklyInterestObligation(borrowAmount, debtInfo.dailyRatePercent);

  // Handle Borrow
  const handleConfirmBorrow = () => {
    if (borrowAmount <= 0) {
      showNotification('Lütfen geçerli bir borç miktarı girin.', 'warn');
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
    setBorrowAmount(amount);
    setBorrowInput(amount.toString());
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

  // Handle Patron Direct Injection (PasHa)
  const handlePatronDeposit = () => {
    if (!isAuthorizedPatron || patronAmount <= 0) return;
    sound.playWin();
    onUpdateBankroll(patronAmount);
    showNotification(
      `+${patronAmount.toLocaleString('tr-TR')}$ VIP Patron Rezervi Bakiyenize Eklendi!`,
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
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title & Identity */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-900 p-0.5 shadow-lg flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Crown className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            </div>
          </div>
          <div>
            <h3 className="font-serif-luxury font-black text-xl sm:text-2xl text-amber-200 tracking-wide">
              GRAND ROYALE KASA & KREDİ FONU
            </h3>
            <p className="text-xs text-slate-400">
              Üye Avans Masası, Günlük Faizli Borç Protokolü ve VIP Fon Yönetimi
            </p>
          </div>
        </div>

        {/* Financial Summary Top Card */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-5">
          {/* Current Bankroll */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-inner">
            <span className="text-[10px] sm:text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
              Oynanabilir Bakiye
            </span>
            <span className="font-serif-luxury font-black text-xl sm:text-2xl text-amber-200">
              ${bankroll.toLocaleString('tr-TR')}
            </span>
          </div>

          {/* Active Debt */}
          <div className={`p-3 sm:p-3.5 rounded-2xl border shadow-inner ${
            hasActiveDebt 
              ? 'bg-red-950/40 border-red-500/50' 
              : 'bg-slate-900/90 border-slate-700/60'
          }`}>
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider block flex items-center justify-between text-red-400">
              <span>Toplam Kasa Borcu</span>
              {hasActiveDebt && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 font-bold">%5 Faiz</span>}
            </span>
            <span className={`font-serif-luxury font-black text-xl sm:text-2xl ${
              hasActiveDebt ? 'text-red-300' : 'text-slate-400'
            }`}>
              ${totalDebt.toLocaleString('tr-TR')}
            </span>
          </div>

          {/* Player Badge */}
          <div className="col-span-2 sm:col-span-1 p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/20 flex flex-col justify-center">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Aktif Üye & Yetki
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isAuthorizedPatron && <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
              <span className="font-serif-luxury font-bold text-sm text-slate-100 truncate">
                {playerName || 'Üye'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300/90 border border-amber-500/20 font-medium ml-auto">
                {isAuthorizedPatron ? 'VIP Patron' : 'Kulüp Üyesi'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-950 border border-amber-500/30 mb-5">
          <button
            id="tab-borrow-btn"
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('borrow');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl font-serif-luxury font-bold text-xs sm:text-sm tracking-wide transition flex items-center justify-center gap-1.5 ${
              activeTab === 'borrow'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-amber-300 hover:bg-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Kasadan Borç / Avans Çek
          </button>

          <button
            id="tab-repay-btn"
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('repay');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl font-serif-luxury font-bold text-xs sm:text-sm tracking-wide transition relative flex items-center justify-center gap-1.5 ${
              activeTab === 'repay'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-amber-300 hover:bg-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            Borç Durumu & Ödeme
            {hasActiveDebt && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute top-2 right-2" />
            )}
          </button>

          {isAuthorizedPatron && (
            <button
              id="tab-patron-btn"
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab('pasha_patron');
              }}
              className={`py-2.5 px-3 rounded-xl font-serif-luxury font-bold text-xs sm:text-sm tracking-wide transition flex items-center justify-center gap-1.5 ${
                activeTab === 'pasha_patron'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 shadow-md'
                  : 'text-amber-400 hover:text-amber-200 hover:bg-amber-950/40'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-400" />
              Patron Kasası
            </button>
          )}
        </div>

        {/* FEEDBACK ALERT */}
        {feedback && (
          <div className={`p-3 rounded-2xl mb-4 text-xs font-bold text-center border animate-bounce ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
              : feedback.type === 'error'
              ? 'bg-red-950/80 border-red-500/60 text-red-300'
              : 'bg-amber-950/80 border-amber-500/60 text-amber-300'
          }`}>
            {feedback.text}
          </div>
        )}

        {/* TAB 1: BORÇ / AVANS ÇEK */}
        {activeTab === 'borrow' && (
          <div className="space-y-4">
            {/* MANDATORY WARNING BANNER - EMPHASIZED AS REQUESTED */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/70 via-slate-900 to-amber-950/60 border-2 border-red-500/70 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-serif-luxury font-black text-sm sm:text-base text-red-300 tracking-wide flex items-center gap-2">
                    <span>⚠️ KASA BORÇ PROTOKOLÜ & FAİZ ŞARTI</span>
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    Kasadan çekilen tüm avanslara <strong className="text-amber-300 font-black">GÜNLÜK %{debtInfo.dailyRatePercent} FAİZ</strong> işletilmektedir.
                  </p>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-red-500/40 text-xs text-red-200 font-bold leading-relaxed">
                    🚨 <u>HAFTALIK FAİZLERİN ÖDENMESİ ŞARTTIR:</u> Çektiğiniz tutarın biriken haftalık faiz borcunu her 7 günde bir düzenli olarak ödemeniz mecburidir. Ödenmeyen faizler ana paraya eklenerek katlanır ve kulüp üyeliğiniz askıya alınır!
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
                <span className="text-[11px] text-slate-400">Anında bakiyenize geçer</span>
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
                      subtitle: 'Çekmek istediğiniz kasa avans tutarını tuşlayın',
                      initialValue: borrowInput,
                      bankroll: 50000000,
                      onConfirm: (num) => {
                        setBorrowAmount(num);
                        setBorrowInput(num > 0 ? num.toString() : '');
                      },
                    })
                  }
                  onFocus={() =>
                    setNumpadConfig({
                      isOpen: true,
                      title: 'Avans Tutarı Belirle',
                      subtitle: 'Çekmek istediğiniz kasa avans tutarını tuşlayın',
                      initialValue: borrowInput,
                      bankroll: 50000000,
                      onConfirm: (num) => {
                        setBorrowAmount(num);
                        setBorrowInput(num > 0 ? num.toString() : '');
                      },
                    })
                  }
                  onKeyDown={handleNumericKeyDown}
                  onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData('text').replace(/\D/g, '');
                    setBorrowInput(text);
                    const parsed = parseInt(text, 10);
                    setBorrowAmount(!isNaN(parsed) ? parsed : 0);
                  }}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setBorrowInput(val);
                    const parsed = parseInt(val, 10);
                    setBorrowAmount(!isNaN(parsed) ? parsed : 0);
                  }}
                  placeholder="0"
                  className="w-full pl-8 pr-36 py-3.5 rounded-2xl bg-slate-900 border-2 border-amber-500/60 text-amber-100 font-serif-luxury font-black text-xl tracking-wider focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/20 shadow-inner cursor-pointer"
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
                        subtitle: 'Çekmek istediğiniz kasa avans tutarını tuşlayın',
                        initialValue: borrowInput,
                        bankroll: 50000000,
                        onConfirm: (num) => {
                          setBorrowAmount(num);
                          setBorrowInput(num > 0 ? num.toString() : '');
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
                      const next = borrowAmount + 1000;
                      setBorrowAmount(next);
                      setBorrowInput(next.toString());
                      sound.playChip();
                    }}
                    className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition"
                  >
                    +1K
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = borrowAmount + 10000;
                      setBorrowAmount(next);
                      setBorrowInput(next.toString());
                      sound.playChip();
                    }}
                    className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition"
                  >
                    +10K
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Borrow Presets */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Hızlı Kredi Paketleri:
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  { label: '$1.000', val: 1000 },
                  { label: '$2.500', val: 2500 },
                  { label: '$5.000', val: 5000 },
                  { label: '$10.000', val: 10000 },
                  { label: '$25.000', val: 25000 },
                ].map(preset => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => handleSelectBorrowPreset(preset.val)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition border ${
                      borrowAmount === preset.val
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105'
                        : 'bg-slate-900/80 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interest Breakdown preview */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/25 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Günlük Faiz Oranı</span>
                <span className="font-serif-luxury font-bold text-sm text-amber-300">
                  %{debtInfo.dailyRatePercent} / Gün
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Günlük Tahakkuk</span>
                <span className="font-serif-luxury font-bold text-sm text-red-300">
                  +${previewDailyInterest.toLocaleString('tr-TR')} / gün
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block font-medium">Haftalık Zorunlu Faiz</span>
                <span className="font-serif-luxury font-bold text-sm text-amber-200">
                  ${previewWeeklyInterest.toLocaleString('tr-TR')} / hafta
                </span>
              </div>
            </div>

            {/* Borrow Action Button */}
            <button
              id="confirm-borrow-btn"
              type="button"
              onClick={handleConfirmBorrow}
              disabled={borrowAmount <= 0}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-slate-950 font-serif-luxury font-black text-sm uppercase tracking-wider shadow-[0_4px_25px_rgba(245,158,11,0.4)] active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <DollarSign className="w-5 h-5 text-slate-950 stroke-[3]" />
              Kasadan ${borrowAmount.toLocaleString('tr-TR')} Borç Çek (Şartları Kabul Et)
            </button>
          </div>
        )}

        {/* TAB 2: BORÇ DURUMU & ÖDEME */}
        {activeTab === 'repay' && (
          <div className="space-y-4">
            {!hasActiveDebt ? (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-emerald-500/30 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-serif-luxury font-bold text-lg text-emerald-300">
                  Tebrikler, Kasa Borcunuz Bulunmuyor!
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Kasaya hiçbir aktif borcunuz veya ödenmemiş faiz yükümlülüğünüz yoktur. 
                  İhtiyacınız olduğunda "Kasadan Borç / Avans Çek" sekmesinden kredi alabilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('borrow')}
                  className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-serif-luxury font-bold text-xs uppercase tracking-wider transition"
                >
                  Yeni Borç / Avans Al
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Debt Card */}
                <div className="p-4 rounded-2xl bg-slate-900/95 border-2 border-red-500/60 shadow-lg space-y-3">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    <div className="p-3 rounded-xl bg-black/50 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Ana Para Borcu</span>
                      <span className="font-serif-luxury font-bold text-lg text-slate-100">
                        ${debtInfo.principal.toLocaleString('tr-TR')}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-black/50 border border-red-500/30">
                      <span className="text-[10px] text-red-400 block font-semibold">Biriken Günlük Faiz</span>
                      <span className="font-serif-luxury font-bold text-lg text-red-300">
                        +${debtInfo.accruedInterest.toLocaleString('tr-TR')}
                      </span>
                    </div>

                    <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-black/50 border border-amber-500/40">
                      <span className="text-[10px] text-amber-400 block font-semibold">Toplam Kapatma Tutarı</span>
                      <span className="font-serif-luxury font-black text-lg text-amber-200">
                        ${totalDebt.toLocaleString('tr-TR')}
                      </span>
                    </div>
                  </div>

                  {/* Weekly Due Alert Box */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    weeklyDueStatus.isOverdue
                      ? 'bg-red-950/80 border-red-500 text-red-200'
                      : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 flex-shrink-0 ${weeklyDueStatus.isOverdue ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
                      <div>
                        <div className="text-xs font-bold">
                          Haftalık Faiz Vadesi: {weeklyDueStatus.text}
                        </div>
                        <div className="text-[10px] text-slate-300">
                          Haftalık faizin ödenmesi şarttır. Vadesinde ödenmeyen faiz ana paraya eklenir.
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
                          `Simülasyon: +1 gün ilerletildi! Günlük %${debtInfo.dailyRatePercent} faiz ($${getDailyInterestAmount(debtInfo.principal, debtInfo.dailyRatePercent).toLocaleString('tr-TR')}) borca eklendi.`,
                          'warn'
                        );
                      }}
                      title="Günü 1 gün ilerleterek faiz tahakkukunu test edin"
                      className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[11px] font-semibold text-slate-200 flex items-center gap-1 transition active:scale-95"
                    >
                      <FastForward className="w-3.5 h-3.5 text-amber-400" />
                      <span>+1 Gün Faiz İşlet</span>
                    </button>
                  </div>
                </div>

                {/* Repayment Options */}
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MinusCircle className="w-4 h-4" />
                    Borç Geri Ödeme Seçenekleri
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Pay Accrued Interest Only */}
                    {debtInfo.accruedInterest > 0 && (
                      <button
                        id="repay-interest-only-btn"
                        type="button"
                        onClick={() => handleRepayAmount(debtInfo.accruedInterest)}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-red-500/50 text-left transition group active:scale-95"
                      >
                        <div className="text-xs font-bold text-red-300 flex items-center justify-between">
                          <span>Sadece Biriken Faizi Öde</span>
                          <span className="text-amber-300 font-serif-luxury font-black">
                            ${debtInfo.accruedInterest.toLocaleString('tr-TR')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Haftalık faiz yükümlülüğünüzü kapatır, ana para borcunuz kalır.
                        </p>
                      </button>
                    )}

                    {/* Pay Full Outstanding Debt */}
                    <button
                      id="repay-full-btn"
                      type="button"
                      onClick={() => handleRepayAmount(totalDebt)}
                      className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/80 to-slate-900 hover:from-emerald-900/80 border border-emerald-500/50 text-left transition group active:scale-95"
                    >
                      <div className="text-xs font-bold text-emerald-300 flex items-center justify-between">
                        <span>Tüm Borcu Kapat</span>
                        <span className="text-emerald-200 font-serif-luxury font-black text-sm">
                          ${totalDebt.toLocaleString('tr-TR')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Ana para + biriken faizin tamamını sıfırlar ve borç dosyasını kapatır.
                      </p>
                    </button>
                  </div>

                  {/* Partial Repayment Custom Input */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2">
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

        {/* TAB 3: PASHA PATRON KASASI (ONLY PASHA) */}
        {activeTab === 'pasha_patron' && isAuthorizedPatron && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif-luxury font-bold text-sm text-amber-200">
                    VIP Patron Masası: PasHa
                  </h4>
                  <p className="text-xs text-slate-300">
                    Patron olarak faizsiz doğrudan kasa fonu enjekte edebilir ve borç kayıtlarını yönetebilirsiniz.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Vault Injection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Doğrudan Fon Takviyesi (Faizsiz Rezerv) ($)
              </label>
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
                      subtitle: 'Kasaya aktarılacak tutarı tuşlayın',
                      initialValue: patronInput,
                      bankroll: 100000000,
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
                      subtitle: 'Kasaya aktarılacak tutarı tuşlayın',
                      initialValue: patronInput,
                      bankroll: 100000000,
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
                  className="w-full pl-8 pr-12 py-3.5 rounded-2xl bg-slate-900 border-2 border-amber-500/60 text-amber-100 font-serif-luxury font-black text-xl tracking-wider focus:outline-none focus:border-amber-400 cursor-pointer"
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
                      subtitle: 'Kasaya aktarılacak tutarı tuşlayın',
                      initialValue: patronInput,
                      bankroll: 100000000,
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
            </div>

            {/* Patron Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handlePatronDeposit}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-serif-luxury font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Kasaya +${patronAmount.toLocaleString('tr-TR')} Rezerv Ekle
              </button>

              {onResetDebt && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playWin();
                    onResetDebt();
                    showNotification('Patron Yetkisi: Tüm borç ve faizler sıfırlandı/affedildi!', 'success');
                  }}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-900 border border-red-500/50 hover:bg-red-950/60 text-red-300 font-serif-luxury font-bold text-xs uppercase tracking-wider transition"
                >
                  Tüm Borçları Affet / Sıfırla
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom Hint */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-500/70" />
            <span>Grand Royale VIP Kasa Tüzüğü Madde 14 — Faiz tahakkuku her gün saat 00:00'da işlenir.</span>
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
      />
    </div>
  );
};
