import React, { useState } from 'react';
import { TableTier, DEFAULT_TABLE_TIERS, formatLimitText } from '../utils/tableTiers';
import { sound } from '../utils/audio';
import { CasinoAmountInput } from './CasinoNumpad';
import {
  Crown,
  Sparkles,
  X,
  Check,
  Zap,
  Sliders,
  AlertCircle,
  ArrowRight,
  Shield,
  Layers,
  Infinity as InfinityIcon,
} from 'lucide-react';

interface TableTierSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: TableTier;
  onSelectTier: (tier: TableTier) => void;
  bankroll: number;
  gameTitle: string;
  onOpenVault?: () => void;
}

export const TableTierSelectorModal: React.FC<TableTierSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  onSelectTier,
  bankroll,
  gameTitle,
  onOpenVault,
}) => {
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');

  // Custom table limit state
  const [customName, setCustomName] = useState<string>('Özel VIP Masası');
  const [customMinBet, setCustomMinBet] = useState<number>(100);
  const [customMaxBet, setCustomMaxBet] = useState<number>(500000);
  const [isUnlimitedMax, setIsUnlimitedMax] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleApplyCustomTable = () => {
    sound.playChip();
    const effectiveMax = isUnlimitedMax ? 0 : Math.max(customMinBet, customMaxBet);
    const customTier: TableTier = {
      id: `custom-${Date.now()}`,
      name: customName.trim() || 'Özel Salon',
      tagline: isUnlimitedMax
        ? `Min $${customMinBet.toLocaleString('tr-TR')}, Üst Sınırsız (∞)`
        : `Min $${customMinBet.toLocaleString('tr-TR')}, Max $${effectiveMax.toLocaleString('tr-TR')}`,
      minBet: customMinBet,
      maxBet: effectiveMax,
      badge: isUnlimitedMax ? '⚡ Özel Limitsiz' : '🛠️ Özel Masa',
      color: isUnlimitedMax ? 'rose' : 'amber',
      accentBorder: isUnlimitedMax ? 'border-rose-500/50' : 'border-amber-500/50',
      bgGradient: isUnlimitedMax ? 'from-rose-950/70 to-slate-900' : 'from-amber-950/70 to-slate-900',
      defaultChip: customMinBet,
      recommendedChips: [customMinBet, customMinBet * 2, customMinBet * 5, customMinBet * 10],
      isVip: customMinBet >= 50000,
    };
    onSelectTier(customTier);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-3xl rounded-3xl bg-slate-950 border-2 border-amber-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), inset 0 1px 3px rgba(245,158,11,0.3)',
        }}
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-amber-500/30 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400/80">
                  {gameTitle} Masaları
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-300">
                  5 Alternatif Salon
                </span>
              </div>
              <h2 className="font-serif-luxury font-black text-lg sm:text-xl text-amber-100">
                Oyun Masası & Bahis Limitini Seç
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Preset Rooms vs Custom Limits */}
        <div className="flex items-center gap-2 px-6 pt-4 pb-2 border-b border-slate-800/80 bg-slate-950/60">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('preset');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'preset'
                ? 'bg-amber-500/20 border border-amber-500 text-amber-300 shadow'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            Hazır Kumarhane Masaları
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('custom');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'custom'
                ? 'bg-amber-500/20 border border-amber-500 text-amber-300 shadow'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Özel Limit Belirle
          </button>

          {/* Current bankroll quick status */}
          <div className="ml-auto hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <span>Bakiye:</span>
            <span className="font-serif-luxury font-bold text-amber-300">
              ${bankroll.toLocaleString('tr-TR')}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 scrollbar-thin">
          {activeTab === 'preset' ? (
            <div className="grid grid-cols-1 gap-3">
              {DEFAULT_TABLE_TIERS.map((tier) => {
                const isCurrent = currentTier.id === tier.id;
                const canAfford = bankroll >= tier.minBet;

                return (
                  <div
                    key={tier.id}
                    onClick={() => {
                      sound.playChip();
                      onSelectTier(tier);
                      onClose();
                    }}
                    className={`group relative rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden ${
                      isCurrent
                        ? 'bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                        : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800 hover:border-amber-500/50 shadow-md hover:shadow-xl'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                            tier.color === 'emerald'
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                              : tier.color === 'blue'
                              ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                              : tier.color === 'purple'
                              ? 'bg-purple-500/10 border-purple-500/40 text-purple-300'
                              : tier.color === 'amber'
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                              : 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                          }`}
                        >
                          {tier.badge}
                        </span>

                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                            Aktif Masa
                          </span>
                        )}

                        {!canAfford && (
                          <span className="px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 text-[10px] font-bold">
                            Bakiye Yetersiz (${tier.minBet.toLocaleString('tr-TR')} gerekli)
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif-luxury font-bold text-base sm:text-lg text-slate-100 group-hover:text-amber-200 transition">
                        {tier.name}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-1">{tier.tagline}</p>
                    </div>

                    {/* Limits box */}
                    <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/80 gap-1 flex-shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Masa Limitleri
                        </div>
                        <div className="font-serif-luxury font-black text-sm sm:text-base text-amber-300">
                          {formatLimitText(tier.minBet, tier.maxBet)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playChip();
                          onSelectTier(tier);
                          onClose();
                        }}
                        className={`mt-1 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow ${
                          isCurrent
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 group-hover:bg-amber-500 text-slate-200 group-hover:text-slate-950'
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Bu Masadasınız
                          </>
                        ) : (
                          <>
                            <span>Masaya Otur</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Custom Table Limit Builder */
            <div className="space-y-4 p-4 sm:p-6 rounded-2xl bg-slate-900/90 border border-amber-500/30">
              <div className="space-y-1">
                <h3 className="font-serif-luxury font-bold text-base text-amber-200 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Kendi Özel Masanızı & Limitlerinizi Ayarlayın
                </h3>
                <p className="text-xs text-slate-300">
                  Dilediğiniz minimum ve maksimum fiş tutarını belirleyerek tek oyunculu masanızı oluşturun.
                  Maksimum bahsi limitsiz (Unlimited ∞) yaparak sermayenizin tamamıyla tavan engeli olmadan oynayabilirsiniz.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Özel Salon İsmi
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Özel VIP Masası"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-200 text-xs focus:outline-none focus:border-amber-400 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Minimum Bahis Tutarı ($)
                    </label>
                    <CasinoAmountInput
                      id="custom-tier-min-bet"
                      value={customMinBet}
                      onChange={(val) => setCustomMinBet(parseInt(val, 10) || 10)}
                      onApply={(amt) => setCustomMinBet(amt || 10)}
                      bankroll={100000000}
                      placeholder="100"
                      title="Minimum Bahis Limiti"
                      subtitle="Masanın kabul edeceği en küçük fiş tutarı"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Maksimum Bahis Tutarı ($)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setIsUnlimitedMax(!isUnlimitedMax);
                        }}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition ${
                          isUnlimitedMax
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-300'
                        }`}
                      >
                        {isUnlimitedMax ? '⚡ Limitsiz Seçili' : '⚡ Limitsiz Yap (∞)'}
                      </button>
                    </div>

                    {isUnlimitedMax ? (
                      <div className="w-full px-3.5 py-2.5 rounded-xl bg-rose-950/40 border border-rose-500/60 text-rose-300 text-xs font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <InfinityIcon className="w-4 h-4" />
                          Sınırsız / Unlimited Bahis (Tavan Yok)
                        </span>
                        <span className="text-[10px] text-rose-400 uppercase tracking-widest">
                          Sermaye Kadar
                        </span>
                      </div>
                    ) : (
                      <CasinoAmountInput
                        id="custom-tier-max-bet"
                        value={customMaxBet}
                        onChange={(val) => setCustomMaxBet(parseInt(val, 10) || 500000)}
                        onApply={(amt) => setCustomMaxBet(amt || 500000)}
                        bankroll={100000000}
                        placeholder="500000"
                        title="Maksimum Bahis Limiti"
                        subtitle="Masanın kabul edeceği en yüksek fiş tutarı"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Summary of custom room */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <span>Belirlenen Limit:</span>
                <span className="font-serif-luxury font-black text-amber-300">
                  Min: ${customMinBet.toLocaleString('tr-TR')} • Max:{' '}
                  {isUnlimitedMax ? 'Sınırsız (∞)' : `$${customMaxBet.toLocaleString('tr-TR')}`}
                </span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyCustomTable}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-serif-luxury font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Özel Masayı Başlat
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with VIP Vault shortcut if bankroll is tight */}
        {onOpenVault && (
          <div className="px-6 py-3.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Yüksek masalara katılmak için bakiyeniz yetersiz mi?
            </span>
            <button
              type="button"
              onClick={() => {
                sound.playChip();
                onClose();
                onOpenVault();
              }}
              className="font-serif-luxury font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
            >
              VIP Patron Kasasından Avans / Fiş Al
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
