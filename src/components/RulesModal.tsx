import React, { useState } from 'react';
import { X, BookOpen, ShieldCheck, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';
import { SLOT_SYMBOLS, PAYLINES } from '../utils/slotConfig';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'blackjack' | 'poker' | 'slot' | 'roulette'>('blackjack');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-950 border border-amber-500/50 shadow-[0_0_50px_rgba(212,175,55,0.3)] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="font-serif-luxury font-bold text-lg sm:text-xl text-amber-300">
              Casino Kuralları & Ödeme Tablosu
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-amber-500/20 bg-slate-900/60 px-6 pt-2 gap-2 text-xs sm:text-sm font-semibold flex-wrap">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('blackjack');
            }}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === 'blackjack'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ♠️ Blackjack (21)
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('poker');
            }}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === 'poker'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🃏 5-Card Draw Poker
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('slot');
            }}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === 'slot'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🎰 Royal Slots
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('roulette');
            }}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === 'roulette'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🎡 Avrupa Ruleti
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300 leading-relaxed">
          {activeTab === 'blackjack' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <h3 className="font-serif-luxury font-bold text-amber-300 text-base mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Blackjack Temel Amacı
                </h3>
                <p>
                  Krupiyeyi geçerek el toplamını 21'e en yakın seviyeye getirmektir. 21'i aşan el (Bust) anında kaybeder.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <h4 className="font-bold text-amber-400 mb-1">Kart Değerleri & As Kuralı</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Sayı kartları (2-10) kendi nominal değerindedir.</li>
                    <li>Resimli kartlar (Vale, Kız, Papaz) 10 değerindedir.</li>
                    <li><strong className="text-amber-300">As (A):</strong> Otomatik olarak 11 veya eli patlatmamak için 1 olarak en avantajlı şekilde hesaplanır.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <h4 className="font-bold text-amber-400 mb-1">Split (Kart Ayırma)</h4>
                  <p className="text-xs">
                    İlk 2 kartınız aynı değerdeyse (örn. 8-8 veya 10-K), elleri ayırıp eşit miktarda ek bahis yatırarak iki bağımsız el olarak oynamaya devam edebilirsiniz.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <h4 className="font-bold text-amber-400 mb-1">Double Down (İkiye Katlama)</h4>
                  <p className="text-xs">
                    İlk iki kartın ardından bahsinizi tam 2 katına çıkarabilir, tam olarak 1 kart daha alıp elinizi kapatabilirsiniz.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <h4 className="font-bold text-amber-400 mb-1">Krupiye Kuralı & Kazanç Oranı</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Doğal Blackjack (As + 10): <strong>3:2 (1.5x)</strong> öder.</li>
                    <li>Standart el galibiyeti: <strong>1:1</strong> öder.</li>
                    <li>Krupiye 16 ve altındayken kart çekmek zorundadır, 17 ve üzerinde durur.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'poker' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <h3 className="font-serif-luxury font-bold text-amber-300 text-base mb-1">
                  5-Card Draw Poker Akışı
                </h3>
                <p className="text-xs">
                  Oyuncuya ve Krupiyeye 5'er kart dağıtılır. Oyuncu elindeki kartlardan istediklerini <strong className="text-amber-300">TUT (HOLD)</strong> eder ve kalan kartları desteden yenileriyle değiştirir. Showdown aşamasında eller karşılaştırılır.
                </p>
              </div>

              <h4 className="font-serif-luxury font-bold text-amber-400 text-sm">El Hiyerarşisi & Ödeme Çarpanları</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { name: 'Royal Flush (Floş Royal)', mult: '250x', desc: 'A-K-Q-J-10 Aynı Takım' },
                  { name: 'Straight Flush (Sıralı Floş)', mult: '50x', desc: 'Aynı takımdan sıralı 5 kart' },
                  { name: 'Four of a Kind (Kare)', mult: '25x', desc: 'Aynı değerde 4 kart' },
                  { name: 'Full House (Ful)', mult: '9x', desc: '3 aynı + 1 per' },
                  { name: 'Flush (Renk)', mult: '6x', desc: 'Aynı takımdan herhangi 5 kart' },
                  { name: 'Straight (Kent)', mult: '4x', desc: 'Farklı takımlardan sıralı 5 kart' },
                  { name: 'Three of a Kind (Üçlü)', mult: '3x', desc: 'Aynı değerde 3 kart' },
                  { name: 'Two Pair (Döper)', mult: '2x', desc: '2 farklı çift' },
                  { name: 'Jacks or Better (Vale ve Üstü Per)', mult: '1x', desc: 'J-Q-K-A Çifti' },
                  { name: 'Low Pair (Düşük Per)', mult: 'İade/Berabere', desc: '10 ve altı çift' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div>
                      <div className="font-semibold text-slate-200">{item.name}</div>
                      <div className="text-[11px] text-slate-400">{item.desc}</div>
                    </div>
                    <span className="font-serif-luxury font-bold text-amber-400 bg-amber-950/60 px-2 py-1 rounded border border-amber-500/30">
                      {item.mult}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'slot' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <h3 className="font-serif-luxury font-bold text-amber-300 text-base mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Royal Slot Makinesi & 5 Kazanç Hattı
                </h3>
                <p className="text-xs">
                  Klasik 3x3 makara matrisinde 5 aktif kazanç çizgisi mevcuttur (Orta, Üst, Alt, 2 Çapraz). Makaralar dönüp durduğunda semboller kusursuz bir şekilde pencereye oturur.
                </p>
              </div>

              <h4 className="font-serif-luxury font-bold text-amber-400 text-sm">Sembol Kazanç Tablosu (3 Sembol Eşleşmesi)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {SLOT_SYMBOLS.map((sym) => (
                  <div key={sym.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                    <span className="text-2xl">{sym.icon}</span>
                    <div>
                      <div className="font-semibold text-slate-200">{sym.name}</div>
                      <div className="font-serif-luxury font-bold text-amber-400">
                        {sym.multiplier3}x Çizgi Bahsi
                      </div>
                      {sym.isWild && <span className="text-[10px] text-yellow-300 font-bold">Her Şeyin Yerine Geçer</span>}
                    </div>
                  </div>
                ))}
              </div>

              <h4 className="font-serif-luxury font-bold text-amber-400 text-sm pt-2">5 Aktif Kazanç Çizgisi</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {PAYLINES.map((pl) => (
                  <div key={pl.id} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: pl.color }} />
                    <span className="font-semibold text-slate-300">{pl.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'roulette' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <h3 className="font-serif-luxury font-bold text-amber-300 text-base mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Avrupa Ruleti Temel Prensipleri (37 Cepli Çark)
                </h3>
                <p>
                  Klasik Avrupa ruletinde 0'dan 36'ya kadar toplam 37 adet cep bulunur. Tek yeşil sıfır (0) olması sayesinde kasa avantajı sadece %2.70'tir (Çift sıfırlı Amerikan ruletine göre oyuncuya çok daha avantajlıdır).
                </p>
              </div>

              <h4 className="font-serif-luxury font-bold text-amber-400 text-sm">Bahis Türleri & Kazanç Oranları</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">Tek Sayı (Straight Up)</span>
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold border border-amber-500/30">35 : 1</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Çark üzerindeki 0-36 arasındaki herhangi tek bir sayıya oynanır. Kazanıldığında bahsin 36 katı ödenir.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">Düzineler (1st, 2nd, 3rd 12)</span>
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold border border-amber-500/30">2 : 1</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">1-12, 13-24 veya 25-36 aralığındaki 12 sayıyı kapsar. Kazanıldığında bahsin 3 katı ödenir.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">Kolonlar (1., 2., 3. Kolon)</span>
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold border border-amber-500/30">2 : 1</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Masadaki 12 sayılık dikey sıralardır. Kazanıldığında bahsin 3 katı ödenir.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">Kırmızı / Siyah (Red / Black)</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/30">1 : 1</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">18 kırmızı veya 18 siyah sayıyı kapsar. Eşit para öder (2x döner). 0 gelirse kaybeder.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">Çift / Tek (Even / Odd)</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/30">1 : 1</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Tüm çift veya tek sayıları kapsar. 0 ne çifttir ne de tektir.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">Düşük / Yüksek (1-18 / 19-36)</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/30">1 : 1</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">İlk 18 veya son 18 sayıyı kapsayan dış bahis türüdür.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-2 text-xs">
                <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Özel Fransız Anons Bahisleri (Call Bets)
                </h4>
                <p className="text-slate-300">
                  Avrupa ruletinde çarkın geometrik sektörlerini tek tıkla oynamak için:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li><strong className="text-amber-300">Voisins du Zéro:</strong> Sıfırın çevresindeki 17 ardışık sayı (22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25).</li>
                  <li><strong className="text-amber-300">Tiers du Cylindre:</strong> Sıfırın karşısındaki 12 sayı (27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33).</li>
                  <li><strong className="text-amber-300">Orphelins:</strong> İki ana dilim arasındaki yetim 8 sayı (1, 20, 14, 31, 9, 17, 34, 6).</li>
                  <li><strong className="text-amber-300">Jeu Zéro:</strong> Sıfıra en yakın 7 komşu cep.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-amber-500/20 bg-slate-900/60 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 transition shadow"
          >
            Anladım, Masaya Dön
          </button>
        </div>
      </div>
    </div>
  );
};
