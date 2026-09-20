# 🎰 Grand Royale VIP Casino

Lüks ve gerçekçi VIP casino deneyimi sunan, modern React 18, TypeScript, Tailwind CSS ve Express ile geliştirilmiş kapsamlı web uygulaması.

---

## ✨ Özellikler

### 🎮 Oyunlar
- **♠️ Blackjack (21):** Hit, Stand, Double Down, Split ve Sigorta (Insurance) kuralları, dinamik kart animasyonları ve krupiye yapay zekası.
- **🃏 5-Card Draw Poker:** Kart tutma (Hold), kart değiştirme ve standart el hiyerarşisi (Royal Flush, Full House, Straight vb.).
- **🎰 Royal Slots:** 5 çarklı, çoklu ödeme çizgili (Paylines), çarpanlı ve jackpot özellikli video slot makinesi.
- **🎡 Grand Royale Avrupa Ruleti:** 37 cepli (0-36) Avrupa rulet masası, dinamik çark animasyonu, İç Bahisler (Düz, Ayrık, Cadde, Köşe) ve Dış Bahisler (Kırmızı/Siyah, Tek/Çift, 1-18/19-36, Düzineler).

### 📊 Performans & VIP İstatistik Paneli
- **Kutulara Tam Sığan Responsive Tasarım:** Taşmaları önleyen, mobil ve masaüstü ekranlara uyumlu metrik kutuları.
- **Zaman Filtreleme:**
  - 📅 **Günlük:** Bugün / Son 24 saat
  - 📅 **Haftalık:** Son 7 gün
  - 📅 **Aylık:** Son 30 gün
  - 📅 **Yıllık:** Son 365 gün / Bu yıl
  - 📅 **Tüm Zamanlar:** Bütün oyun geçmişi
- **Detaylı Analiz:** Toplam oyun sayısı, toplam yatırılan bahis, toplam kazanç, net kâr/zarar, kazanma yüzdesi, en yüksek tekil kazanç ve oyun bazlı galibiyet dağılımları.

### 👑 PasHa VIP Yönetici Ayrıcalıkları
- Oyuncu adı `PasHa` olduğunda VIP yetki modu otomatik olarak devreye girer.
- İstatistik panelini ve tüm oyun geçmişini iki aşamalı onay ile sıfırlayabilme yetkisi.
- VIP Kasa üzerinden sınırsız bakiye tanımlayabilme ve masa yetkileri.

### 🔊 Ses Efektleri & Atmosfer
- Web Audio API ile sıfır harici kütüphane bağımlılığıyla çalışan çip, kart dağıtma, çark dönme, slot makinesi ve kazanma ses efektleri.
- Ses açma / kapatma desteği.

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- **Node.js**: v18 veya daha yeni bir sürüm
- **npm** veya **pnpm** / **yarn**

### Adımlar

1. **Projeyi indirin / klonlayın:**
```bash
git clone <repo-adresi>
cd grand-royale-casino
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Geliştirici modunda çalıştırın:**
```bash
npm run dev
```
Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışacaktır.

4. **Üretim için derleyin (Build):**
```bash
npm run build
npm start
```

---

## 🛠️ Kullanılan Teknolojiler

- **Frontend:** React 18, Vite, TypeScript
- **Stil & Tasarım:** Tailwind CSS, Lucide React İkonları
- **Backend & Middleware:** Express.js, Vite Dev Server Middleware
- **Ses Motoru:** HTML5 Web Audio API (Sentetik analog casino sesleri)
- **Depolama:** LocalStorage veri kalıcılığı (İstatistikler, geçmiş, bakiye, oyuncu profili)

---

## 📄 Lisans
Bu proje özel kullanım ve eğitim amaçlı hazırlanmıştır.
