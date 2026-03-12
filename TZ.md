# Texnik Topshiriq (TZ): "Quti" — Ehson Qutilari Boshqaruv Tizimi

> Bu hujjat Claude AI yoki boshqa AI agentga loyihani noldan qurishni topshirish uchun mo'ljallangan.

---

## 1. Loyiha haqida umumiy ma'lumot

**Nomi:** Quti — Ehson Qutilari Boshqaruv Tizimi
**Maqsadi:** Xayriya tashkiloti uchun shahar bo'ylab o'rnatilgan ehson (sadaqa) qutilarini boshqarish: yangi quti qo'shish, holatini kuzatish (to'la/bo'sh), joylashuvini xaritada ko'rish, rasmlarini yuklash.
**Platforma:** Mobile-first SPA (Progressive Web App). Asosan telefonda ishlatiladi, lekin planshet va desktopda ham ishlaydi.
**Til:** Interfeys to'liq o'zbek tilida.

---

## 2. Texnologiyalar steki

| Kategoriya | Texnologiya |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite (SWC plugin) |
| Routing | React Router v6 (BrowserRouter) |
| Server state | TanStack React Query v5 |
| Client state | Zustand (sessionStorage persist) |
| Formlar | React Hook Form + Zod validatsiya |
| UI komponentlar | Radix UI primitives |
| Stillar | Tailwind CSS v3 (CSS variables, HSL format, dark mode class strategy) |
| Animatsiyalar | Framer Motion + Tailwind keyframes |
| Bildirishnomalar | Sonner (toast) |
| Xarita | Leaflet + react-leaflet (ArcGIS Satellite tiles) |
| Ikonkalar | Lucide React |
| PWA | vite-plugin-pwa (Workbox) |

### Path alias
`@` → `./src` — barcha importlarda `@/components/...` formatida ishlatilsin.

### TypeScript sozlamalari
Konfiguratsiya ataylab yumshoq: `noImplicitAny: false`, `strictNullChecks: false`. Qat'iylashtirish kerak emas.

### Stillar konvensiyasi
- Tailwind utility class'lar asosiy
- Conditional class'lar uchun `clsx` + `tailwind-merge` (`cn()` helper)
- Komponent variantlari uchun `class-variance-authority` (CVA)
- Rang palitralari CSS variable sifatida HSL formatda `src/index.css` da aniqlangan

---

## 3. Backend API

**Base URL:** `https://api.mehrli.uz/v1/quti`
**Autentifikatsiya:** `X-Api-Key` header (PIN tasdiqlash orqali olinadi)

### 3.1. Endpointlar

#### PIN tasdiqlash
```
POST /verify
Content-Type: application/x-www-form-urlencoded
Body: pin=123456
Response: { hash: "api-key-string", expires_in?: number }
```
`hash` qiymati keyingi so'rovlarda `X-Api-Key` sifatida ishlatiladi.

#### Qutilar ro'yxati
```
GET /list
Response: { items: Box[] }
```

#### Rasm yuklash
```
POST /upload
Content-Type: multipart/form-data
X-Api-Key: <key>
Body: file=<image>
Response: { files: BoxImage[] }
```

#### Quti yaratish
```
POST /create
Content-Type: application/json
X-Api-Key: <key>
Body: {
  number: integer,        // Quti raqami
  location: "lat;lng",    // Masalan: "41.3247603;69.3235123"
  images: BoxImage[]      // /upload dan qaytgan obyektlar
}
```

#### Qutini bo'sh deb belgilash
```
GET /set-empty?id=<id>
X-Api-Key: <key>
```

#### Qutini o'chirish
```
GET /remove?id=<id>
X-Api-Key: <key>
```

### 3.2. Xatolarni qayta ishlash
- **429** — `"Juda ko'p so'rov yuborildi"`
- **Tarmoq xatosi** — `"Internet aloqasi yo'q"`
- Har bir endpoint uchun o'zbek tilida maxsus xato xabarlari
- Barcha xatolar `toast.error()` orqali ko'rsatilsin

---

## 4. Ma'lumotlar modeli (TypeScript interfeyslari)

```typescript
interface Box {
  id: string;
  number: number;
  location: string;          // "lat;lng" format
  images: BoxImage[];
  is_empty: boolean;
  created_at: string;        // ISO date
}

interface BoxImage {
  name: string;
  type: string;
  size: number;
  base_url: string;
  path: string;
  url: string;               // To'liq rasm URL
  delete_url: string;
}
```

---

## 5. Sahifalar va Ekranlar

### 5.1. PinPage — Kirish sahifasi

**Marshrut:** Autentifikatsiya bo'lmaganda barcha URL'lar shu sahifaga yo'naltiriladi.

**Tavsif:**
- Ekran markazida 6 ta doira (dot) — kiritilgan raqamlar soni ko'rsatiladi
- Raqamli klaviatura: 1-9, 0, "Tozalash" (barchasini o'chirish), "⌫" (oxirgisini o'chirish)
- PIN 6 raqamga yetganda avtomatik `verifyPin()` chaqiriladi
- Yuklash vaqtida spinner ko'rsatilsin
- **Noto'g'ri PIN kiritilganda:** input doiralari 500ms davomida "shake" animatsiyasi bilan silkinadi
- Muvaffaqiyatli kirishda `apiKey` Zustand store'ga saqlanadi va BoxesPage'ga o'tiladi

### 5.2. BoxesPage — Asosiy sahifa

**Marshrut:** `/` (faqat autentifikatsiya bo'lganda)

Bu ilovaning asosiy sahifasi. Ikki tab'dan iborat: **Ro'yxat** va **Xarita**.

#### 5.2.1. Header
- Chap tomonda: Logo yoki ilova nomi ("Ehson qutilari")
- O'ng tomonda: Chiqish tugmasi (LogOut icon) — bosilganda `lock()` chaqiriladi

#### 5.2.2. Ro'yxat ko'rinishi (List Tab)

**Filtrlar paneli (gorizontal scroll):**
- "Barchasi" — barcha qutilar
- "Bo'sh" — faqat bo'sh qutilar (`is_empty: true`)
- "To'la" — faqat to'la qutilar (`is_empty: false`)
- "Yaqin" — foydalanuvchi joylashuviga eng yaqindan uzoqqa tartiblash (Haversine formula)

**Qutilar ro'yxati (card grid):**
Har bir karta quyidagilarni ko'rsatadi:
- Quti raqami (`#123`)
- Yaratilgan sana
- Holat badge'i: "Bo'sh" (kulrang) yoki "To'la" (yashil)
- Quti ikonkasi

**Karta bosilganda:** pastdan BottomSheet ochiladi (BoxDetail — 5.3 ga qarang).

#### 5.2.3. Xarita ko'rinishi (Map Tab)
- Leaflet xaritasi ArcGIS Satellite tiles bilan
- Foydalanuvchi joylashuvi aniqlanadi va xarita shu joyga markazlashadi
- Barcha qutilar xaritada pin sifatida ko'rsatiladi:
  - **Yashil pin (#2da882)** — to'la quti
  - **Kulrang pin (#94a3b8)** — bo'sh quti
- Pin bosilganda: BoxDetail BottomSheet ochiladi

#### 5.2.4. FAB (Floating Action Button)
- Ekranning pastki o'ng burchagida "+" tugmasi
- Bosilganda: AddBox BottomSheet ochiladi (5.4 ga qarang)

#### 5.2.5. Pastki navigatsiya (Bottom Tabs)
- Ikki tab: "Ro'yxat" va "Xarita"
- Aktiv tab rangi ajratilgan

### 5.3. BoxDetail — Quti tafsilotlari (BottomSheet)

BottomSheet ichida ko'rsatiladi (alohida sahifa emas):

- **Quti raqami va holati** (badge)
- **Joylashuv xaritasi:** kichik read-only Leaflet xarita (zoom/pan o'chirilgan)
- **Koordinatalar:** lat, lng ko'rsatiladi
- **Rasmlar galereyasi:**
  - Carousel formatda ko'rsatiladi (oldingi/keyingi tugmalari, dot indikatorlar)
  - Rasm bosilganda: to'liq ekranli lightbox ochiladi
  - Lightbox'da: swipe bilan navigatsiya, dot indikatorlar, tashqarini bosib yopish
- **Amallar tugmalari:**
  - "Bo'shatish" — ConfirmDialog ochiladi → tasdiqlanganda `setEmpty()` chaqiriladi
  - "Navigatsiya" — Google Maps'da ochiladi (`google.com/maps/dir/...`)
- **O'chirish:** Quti ikonkasini **5 soniya bosib turish** (long-press):
  - Aylana shaklidagi progress ko'rsatiladi (5s davomida to'ladi)
  - Tugallangach: ConfirmDialog ochiladi → tasdiqlanganda `removeBox()` chaqiriladi

### 5.4. AddBox — Yangi quti qo'shish (BottomSheet)

BottomSheet ichida ko'rsatiladi:

**Formalar:**
1. **Quti raqami** — integer, majburiy
2. **Joylashuv tanlash:**
   - Sheet ochilganda avtomatik geolokatsiya so'raladi
   - Interactive Leaflet xarita — foydalanuvchi xaritani bosib koordinata tanlaydi
   - "Hozirgi joylashuv" tugmasi — GPS koordinatalarini oladi
   - Tanlangan joy xaritada marker bilan ko'rsatiladi
3. **Rasmlar yuklash:**
   - Maksimum 3 ta rasm
   - Rasm tanlaganda preview ko'rsatiladi (`URL.createObjectURL`)
   - Yuklash `Promise.all()` bilan parallel amalga oshiriladi

**Yuborish:**
1. Validatsiya: raqam, joylashuv, kamida 1 rasm
2. Avval rasmlar `/upload` ga yuboriladi
3. Keyin `/create` ga box ma'lumotlari yuboriladi
4. Muvaffaqiyatda: sheet yopiladi, ro'yxat yangilanadi (React Query invalidation)

---

## 6. State Management

### 6.1. Auth Store (Zustand + sessionStorage)

```typescript
interface AuthState {
  apiKey: string | null;
  lockedAt: number | null;

  login(key: string): void;     // apiKey saqlash + timer boshlash
  lock(): void;                 // apiKey tozalash (chiqish)
  isLocked(): boolean;          // 5 daqiqa o'tganmi tekshirish
  resetTimer(): void;           // Faollik timer'ini yangilash
}
```

**Muhim xatti-harakatlar:**
- **Auto-lock:** 5 daqiqa (`5 * 60 * 1000` ms) faolsizlikdan keyin avtomatik qulflanadi
- **Timer reset:** Har bir API so'rov, filtr o'zgartirish, forma yuborishda `resetTimer()` chaqiriladi
- **Persist:** `sessionStorage` — brauzer yopilganda o'chadi

### 6.2. Server State (TanStack React Query)
- Query key: `["boxes"]` — qutilar ro'yxati
- Mutatsiyalardan keyin `queryClient.invalidateQueries(["boxes"])` chaqiriladi

---

## 7. Komponentlar kutubxonasi

### 7.1. BottomSheet
- Pastdan yuqoriga ochiluvchi modal
- Semi-transparent backdrop (bosilsa yopiladi)
- Rounded top corners
- Drag handle (visual)
- Scrollable content
- `z-index: 2000`
- Body overflow boshqaruvi

### 7.2. ConfirmDialog
- Markaziy modal oyna
- Sarlavha, tavsif, tasdiqlash tugmasi (customize qilinadigan)
- `z-index: 3000`
- Backdrop bilan

### 7.3. ImageGallery
- Carousel: oldingi/keyingi tugmalar, dot indikatorlar
- Lightbox: to'liq ekran, swipe support (50px threshold), keyboard navigatsiya
- `z-index: 9999`

### 7.4. MapView (uch xil map komponenti)
1. **BoxesMap** — barcha qutilarni ko'rsatish (clickable pins, user location)
2. **SingleBoxMap** — bitta qutini ko'rsatish (read-only, interaction o'chirilgan)
3. **LocationPickerMap** — joylashuv tanlash uchun interactive xarita (click → marker)

**Umumiy xususiyatlar:**
- ArcGIS Satellite tile layer
- Custom SVG pin ikonkalari (yashil/kulrang)
- `RecenterMap` — xaritani berilgan koordinataga markazlash
- `MapClickHandler` — xarita bosilganda koordinata olish

### 7.5. Button (CVA)
- Variantlar: `default`, `secondary`, `outline`, `ghost`, `destructive`
- O'lchamlar: `sm`, `md`, `lg`, `icon`

---

## 8. Geolokatsiya xususiyatlari

- `navigator.geolocation.getCurrentPosition()` ishlatiladi
- Ishlatilish joylari:
  - Xarita tab'iga o'tganda — markazlash uchun
  - AddBox sheet ochilganda — boshlang'ich joylashuv uchun
  - "Yaqin" filtri tanlaganda — masofani hisoblash uchun
- Ruxsat berilmasa: xato ko'rsatilmaydi, jimgina o'tkazib yuboriladi
- **Haversine formula** masofani hisoblash uchun (yer radiusi: 6371 km)

---

## 9. PWA konfiguratsiyasi

```
vite-plugin-pwa (Workbox)
```

- **Service Worker:** auto-update
- **Caching strategiyalari:**
  - API so'rovlari: `NetworkFirst` (5 daqiqa kesh)
  - Xarita tiles: `CacheFirst` (30 kun kesh)
  - Statik rasmlar: `CacheFirst` (7 kun kesh)
- **Manifest:**
  - `display: standalone`
  - Tema ranglari belgilangan
  - App ikonkalari

---

## 10. Rang palitrasiyasi va dizayn

### Ranglar (CSS variables, HSL)
| Nom | Qiymat | Ishlatilishi |
|---|---|---|
| Primary | `#2da882` (teal/yashil) | Tugmalar, aktiv holatlar, to'la quti pin |
| Background | `#f0f3f1` (och kulrang) | Sahifa foni |
| Foreground | `#1f2937` (to'q ko'k) | Matn |
| Destructive | `#f53939` (qizil) | O'chirish, xatolar |
| Muted | `#94a3b8` (kulrang) | Bo'sh quti pin, ikkinchi darajali matn |

### Responsive dizayn
- Mobile-first: `max-w-sm` / `max-w-md` container
- `100dvh` (dynamic viewport height) — mobil brauzer toolbar'ini hisobga oladi
- `env(safe-area-inset-bottom)` — notch'li qurilmalar uchun
- Touch target minimum: 48px

---

## 11. Animatsiyalar

| Animatsiya | Qo'llanilishi | Davomiyligi |
|---|---|---|
| Shake | Noto'g'ri PIN kiritilganda input silkinadi | 500ms |
| Spin | Yuklanish spinner'lari | Cheksiz |
| Scale | Tugma bosilganda kichrayish (`active:scale-95`) | Bir lahzalik |
| Progress circle | Long-press o'chirish | 5000ms |

---

## 12. Fayl tuzilishi

```
src/
├── App.tsx                     # Root komponent, routing logikasi
├── main.tsx                    # Entry point (React render)
├── types.ts                    # TypeScript interfeyslari (Box, BoxImage)
├── index.css                   # Tailwind direktivlari + CSS variables + keyframes
├── api/
│   └── client.ts               # Barcha API funksiyalari + error handling
├── store/
│   └── authStore.ts            # Zustand auth store (persist: sessionStorage)
├── lib/
│   └── utils.ts                # cn() helper, parseLocation(), mapsUrl()
├── pages/
│   ├── PinPage.tsx             # PIN kiritish sahifasi
│   └── BoxesPage.tsx           # Asosiy sahifa (list + map + sheets)
├── components/
│   ├── MapView.tsx             # Leaflet xarita komponentlari
│   ├── BottomSheet.tsx         # Pastki sheet modal
│   ├── ConfirmDialog.tsx       # Tasdiqlash dialog
│   ├── ImageGallery.tsx        # Rasm galereyasi + lightbox
│   └── ui/
│       └── button.tsx          # Button CVA komponenti
└── assets/                     # Ikonkalar, rasmlar
```

---

## 13. Routing logikasi

```
App.tsx:
  ├── apiKey mavjud va isLocked() === false?
  │   ├── HA → <BoxesPage /> ("/")
  │   └── YO'Q → <PinPage /> (barcha URL'lar)
```

Routing juda sodda: faqat ikki holat — autentifikatsiya bor yoki yo'q. Ichki navigatsiya (detail, add) BottomSheet'lar orqali amalga oshiriladi, alohida route'lar yo'q.

---

## 14. Muhim xatti-harakatlar va edge case'lar

1. **PIN kiritish:** 6 ta raqam to'lganda avtomatik yuboriladi — "Submit" tugmasi yo'q
2. **Auto-lock:** Foydalanuvchi 5 daqiqa hech narsa qilmasa, PinPage'ga qaytariladi
3. **Rasm limiti:** Har bir qutiga maksimum 3 ta rasm yuklanadi
4. **Geolokatsiya ruxsati:** Foydalanuvchi ruxsat bermasa, ilova buzilmasdan ishlashda davom etadi
5. **Offline:** PWA keshi tufayli oxirgi ma'lumotlar ko'rsatiladi, yangi so'rovlar NetworkFirst strategiyasi bilan amalga oshiriladi
6. **Long-press o'chirish:** Tasodifiy o'chirishni oldini olish uchun 5 soniya bosib turish kerak
7. **React Query invalidation:** Har qanday mutatsiya (create, set-empty, remove) dan keyin ro'yxat avtomatik yangilanadi

---

## 15. O'rnatish va ishga tushirish

```bash
npm install             # Bog'liqliklarni o'rnatish
npm run dev             # Dev server (port 8081)
npm run build           # Production build
npm run preview         # Production build'ni ko'rish
npm run lint            # ESLint tekshiruvi
```

**Vite konfiguratsiyasi:**
- Port: 8081
- SWC plugin (tez kompilatsiya)
- Path alias: `@` → `./src`
- PWA plugin sozlamalari

---

## 16. AI Agent uchun ko'rsatmalar

Agar siz bu TZ asosida loyihani qurayotgan bo'lsangiz:

1. **Avval bazaviy tuzilmani yarating:** Vite + React + TypeScript + Tailwind + path alias
2. **Keyin API layer'ini yozing:** `src/api/client.ts` — barcha endpointlar, error handling, toast xabarlari
3. **Auth store yarating:** Zustand + sessionStorage persist + auto-lock
4. **PinPage'ni yarating:** 6-raqamli keypad, shake animatsiya, auto-submit
5. **BoxesPage'ni yarating:** Bu eng katta komponent — list view, map view, bottom tabs, FAB
6. **Komponentlarni yarating:** BottomSheet, ConfirmDialog, ImageGallery, MapView
7. **BoxDetail va AddBox sheet'larini BoxesPage ichida yarating**
8. **PWA konfiguratsiyasini qo'shing**
9. **Responsive va mobile optimizatsiyalarini tekshiring**

**Diqqat:**
- Barcha matnlar o'zbek tilida bo'lsin
- TypeScript strictness'ni oshirmang
- BottomSheet'lar alohida route emas, inline komponentlar
- Xarita uchun ArcGIS Satellite tiles ishlating (OpenStreetMap emas)
- Geolokatsiya xatolari jimgina handle qilinsin (UI buzilmasin)
