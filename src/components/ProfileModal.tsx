import React, { useState } from 'react';
import { X, Crown, User, ShieldCheck, Check, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';
import { isVipManager } from '../types';
import { sound } from '../utils/audio';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  onUpdatePlayerName: (newName: string) => void;
  onOpenVaultModal?: () => void;
  onResetStats?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  playerName,
  onUpdatePlayerName,
  onOpenVaultModal,
  onResetStats,
}) => {
  const [inputName, setInputName] = useState<string>(playerName);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [resetDone, setResetDone] = useState<boolean>(false);

  // Sync state if modal opens
  React.useEffect(() => {
    if (isOpen) {
      setInputName(playerName);
      setSavedSuccess(false);
    }
  }, [isOpen, playerName]);

  if (!isOpen) return null;

  const isCurrentPasha = isVipManager(inputName);
  const isExistingPasha = isVipManager(playerName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = inputName.trim();
    if (!cleanName) return;

    sound.playChip();
    onUpdatePlayerName(cleanName);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleQuickSelect = (name: string) => {
    sound.playClick();
    setInputName(name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-amber-500/40 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 30px rgba(245, 158, 11, 0.15)',
        }}
      >
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

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

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-lg">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              {isCurrentPasha ? (
                <Crown className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              ) : (
                <User className="w-6 h-6 text-slate-300" />
              )}
            </div>
          </div>
          <div>
            <h3 className="font-serif-luxury font-black text-xl text-amber-200 tracking-wide">
              Oyuncu Profili & İsim Değiştir
            </h3>
            <p className="text-xs text-slate-400">
              Casino masalarında ve VIP kayıtlarda görüntülenecek adınız
            </p>
          </div>
        </div>

        {/* Status Card based on input */}
        <div 
          className={`p-4 rounded-2xl border mb-6 transition-all duration-300 ${
            isCurrentPasha
              ? 'bg-amber-950/30 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-start gap-3">
            {isCurrentPasha ? (
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 flex-shrink-0">
                <Crown className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-slate-800 text-slate-400 flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-amber-300">
                  {isCurrentPasha ? 'VIP Casino Müdürü (Tam Yetki)' : 'Standart VIP Oyuncu'}
                </span>
                {isCurrentPasha && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                    Kasa Yetkisi Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isCurrentPasha
                  ? 'Kullanıcı adı PasHa olarak ayarlandığında VIP Kasa takviyesi, serbest fon ekleme ve tüm kasa kontrolleri kilitsiz açılır.'
                  : "VIP Kasayı yönetebilmek ve serbest kasa takviyesi yapabilmek için kullanıcı adınızın 'PasHa' olması gerekmektedir."}
              </p>
            </div>
          </div>
        </div>

        {/* Change Name Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              Oyuncu Adı (Rumuz)
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                maxLength={20}
                placeholder="Örn: PasHa"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-amber-500/40 text-slate-100 placeholder-slate-500 font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition text-sm"
              />
              {isVipManager(inputName) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                  <Crown className="w-3 h-3 text-amber-400" />
                  PasHa Yetkili
                </div>
              )}
            </div>
          </div>

          {/* Quick Name Suggestions */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Hızlı Seçim:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleQuickSelect('PasHa')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  inputName.toLowerCase() === 'pasha'
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                    : 'bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                PasHa (VIP Yetkili)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect('Bahadır')}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-700 text-slate-300 hover:text-amber-300 hover:border-amber-500/30 transition"
              >
                Bahadır
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect('HighRoller')}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-700 text-slate-300 hover:text-amber-300 hover:border-amber-500/30 transition"
              >
                HighRoller
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect('Misafir')}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-700 text-slate-300 hover:text-amber-300 hover:border-amber-500/30 transition"
              >
                Misafir
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={!inputName.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-serif-luxury font-bold text-sm uppercase tracking-wider shadow-lg active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Kaydedildi!
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Oyuncu Adını Kaydet
                </>
              )}
            </button>

            {onOpenVaultModal && isExistingPasha && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVaultModal();
                }}
                className="py-3 px-4 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 hover:bg-slate-800 text-xs font-bold uppercase tracking-wider transition"
              >
                Kasa Yönetimi
              </button>
            )}
          </div>

          {/* PasHa Authority: Reset Statistics */}
          {isExistingPasha && onResetStats && (
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  PasHa Yetkisi: İstatistik Sıfırlama
                </span>
                {!showConfirmReset && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(true)}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3 h-3 text-rose-400" />
                    <span>Sıfırla</span>
                  </button>
                )}
              </div>

              {resetDone && (
                <div className="text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 p-2 rounded-xl text-center">
                  İstatistikler ve oyun geçmişi başarıyla sıfırlandı!
                </div>
              )}

              {showConfirmReset && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 flex items-center justify-between gap-2 text-xs">
                  <span className="text-rose-200">Tüm geçmiş silinsin mi?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowConfirmReset(false)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 hover:text-white"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playChip();
                        onResetStats();
                        setShowConfirmReset(false);
                        setResetDone(true);
                        setTimeout(() => setResetDone(false), 2000);
                      }}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
                    >
                      Evet, Sıfırla
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
