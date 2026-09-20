import React, { useState } from 'react';
import { X, Crown, ShieldAlert, ShieldCheck, Zap, Plus, DollarSign, RefreshCw, Sparkles, UserCheck } from 'lucide-react';
import { isVipManager } from '../types';
import { sound } from '../utils/audio';

interface VipVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankroll: number;
  onUpdateBankroll: (delta: number) => void;
  onSetBankroll?: (newAmount: number) => void;
  playerName: string;
  onSwitchToPasha: () => void;
  onOpenProfile: () => void;
}

export const VipVaultModal: React.FC<VipVaultModalProps> = ({
  isOpen,
  onClose,
  bankroll,
  onUpdateBankroll,
  onSetBankroll,
  playerName,
  onSwitchToPasha,
  onOpenProfile,
}) => {
  const isAuthorized = isVipManager(playerName);

  // Manual amount state
  const [manualAmount, setManualAmount] = useState<number>(5000);
  const [customInput, setCustomInput] = useState<string>('5000');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setManualAmount(num);
    } else {
      setManualAmount(0);
    }
  };

  const handleQuickAddAmount = (add: number) => {
    sound.playChip();
    const next = (manualAmount || 0) + add;
    setManualAmount(next);
    setCustomInput(next.toString());
  };

  const handleSetExactPreset = (amount: number) => {
    sound.playChip();
    setManualAmount(amount);
    setCustomInput(amount.toString());
  };

  const handleDeposit = () => {
    if (!isAuthorized) return;
    if (manualAmount <= 0) return;

    sound.playWin();
    onUpdateBankroll(manualAmount);
    setFeedbackMessage(`+${manualAmount.toLocaleString('tr-TR')}$ VIP Kasaya Eklendi!`);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 2500);
  };

  const handleSetExactBankroll = () => {
    if (!isAuthorized || !onSetBankroll) return;
    if (manualAmount < 0) return;

    sound.playWin();
    onSetBankroll(manualAmount);
    setFeedbackMessage(`VIP Kasa Bakiyesi $${manualAmount.toLocaleString('tr-TR')} olarak ayarlandı!`);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-amber-500/50 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 35px rgba(245, 158, 11, 0.2)',
        }}
      >
        {/* Glow effects */}
        <div className="absolute -top-12 -right-12 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-900 p-0.5 shadow-lg">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Crown className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif-luxury font-black text-xl sm:text-2xl text-amber-200 tracking-wide">
                VIP KASA YÖNETİM MERKEZİ
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Grand Royale Salonu Özel Rezerv ve Manuel Fon Transferi
            </p>
          </div>
        </div>

        {/* Current Balance Overview */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-between mb-6 shadow-inner">
          <div>
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
              Mevcut VIP Kasa Bakiyesi
            </span>
            <span className="font-serif-luxury font-black text-2xl sm:text-3xl text-amber-200">
              ${bankroll.toLocaleString('tr-TR')}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Aktif Oyuncu:</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-amber-500/30 text-amber-300 font-bold text-xs">
              {isAuthorized ? <Crown className="w-3.5 h-3.5 text-amber-400" /> : null}
              {playerName || 'İsimsiz'}
            </div>
          </div>
        </div>

        {/* Authorization Check */}
        {!isAuthorized ? (
          /* LOCKED STATE - Only PasHa is allowed */
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-red-950/40 border border-red-500/50 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 flex-shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-serif-luxury font-bold text-base text-red-300">
                    Erişim Kısıtlandı: VIP Kasa Yetkisi Yok
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    VIP Kasa takviyesi rakamını manuel belirleme ve kasa fonlarını yönetme yetkisi 
                    <strong className="text-amber-300 font-bold"> yalnızca 'PasHa' </strong> 
                    kullanıcısına tahsis edilmiştir. Şu anki aktif kullanıcı: 
                    <span className="text-slate-100 font-semibold underline ml-1">
                      {playerName || 'Misafir'}
                    </span>.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Switch to PasHa or Rename */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-3">
              <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Yetkiyi Açmak İster misiniz?
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tek tıkla kullanıcı adınızı <strong>PasHa</strong> olarak güncelleyebilir ve VIP Kasa fon kontrolünü anında devralabilirsiniz.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sound.playWin();
                    onSwitchToPasha();
                  }}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-serif-luxury font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4 text-slate-950" />
                  PasHa Olarak Giriş Yap & Yetkiyi Aç
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onClose();
                    onOpenProfile();
                  }}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
                >
                  Farklı İsim Yaz
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* UNLOCKED STATE - PasHa Authorized Manager */
          <div className="space-y-5">
            {/* Manager Badge */}
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    VIP Yetkili Patron: PasHa
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Özel Kasa Takviyesi ve Fon Yönetimi Yetkisi Aktif
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onClose();
                  onOpenProfile();
                }}
                className="text-[11px] text-amber-400 hover:text-amber-200 underline font-medium px-2 py-1"
              >
                İsim Değiştir
              </button>
            </div>

            {/* Manual Amount Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  Manuel Takviye Miktarı Belirle ($)
                </label>
                <span className="text-[11px] text-slate-400">İstediğiniz rakamı yazın</span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={customInput}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full pl-8 pr-28 py-3.5 rounded-2xl bg-slate-900 border-2 border-amber-500/60 text-amber-100 font-serif-luxury font-black text-xl tracking-wider focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/20 shadow-inner"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-serif-luxury font-black text-lg">
                  $
                </span>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQuickAddAmount(1000)}
                    className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition"
                  >
                    +1K
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddAmount(10000)}
                    className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition"
                  >
                    +10K
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Hızlı Fiş Paketleri:
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { label: '$1.000', val: 1000 },
                  { label: '$5.000', val: 5000 },
                  { label: '$25.000', val: 25000 },
                  { label: '$50.000', val: 50000 },
                  { label: '$100.000', val: 100000 },
                  { label: '$1.000.000', val: 1000000 },
                ].map(preset => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => handleSetExactPreset(preset.val)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition border ${
                      manualAmount === preset.val
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105'
                        : 'bg-slate-900/80 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Message */}
            {feedbackMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-bold text-center text-xs animate-bounce shadow-lg">
                ✨ {feedbackMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleDeposit}
                disabled={manualAmount <= 0}
                className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-serif-luxury font-black text-sm uppercase tracking-wider shadow-[0_4px_20px_rgba(16,185,129,0.4)] active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5 text-slate-950 stroke-[3]" />
                Kasaya +${manualAmount.toLocaleString('tr-TR')} Ekle
              </button>

              {onSetBankroll && (
                <button
                  type="button"
                  onClick={handleSetExactBankroll}
                  disabled={manualAmount <= 0}
                  title="Kasayı tam bu rakama eşitler"
                  className="w-full sm:w-auto py-3.5 px-4 rounded-xl bg-slate-900 border border-amber-500/50 hover:bg-slate-800 text-amber-300 font-serif-luxury font-bold text-xs uppercase tracking-wider transition"
                >
                  Bakiyeyi ${manualAmount.toLocaleString('tr-TR')} Yap
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
