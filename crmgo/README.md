# CRMGO React — Hệ thống CRM In ấn & Bao bì

> Phiên bản React (Vite + Zustand) — migrate từ single-file HTML

---

## 🚀 Khởi chạy nhanh

```bash
npm install
npm run dev
# → http://localhost:5173
```

## 📦 Build production

```bash
npm run build
# Output: dist/
```

---

## 🏗️ Kiến trúc dự án

```
src/
├── main.jsx                  ← Entry point
├── App.jsx                   ← Root component (auth gate)
├── store/
│   └── index.js              ← Zustand stores (auth, data, ui)
├── utils/
│   ├── constants.js          ← DB_KEYS, CATS, DEMO_ACCOUNTS, ...
│   └── helpers.js            ← fmt(), parseNum(), fmtDate(), ...
├── styles/
│   └── globals.css           ← CSS variables + all UI styles
├── components/
│   ├── auth/
│   │   └── LoginScreen.jsx   ← Login với role selector
│   ├── layout/
│   │   ├── AppShell.jsx      ← Shell + role routing
│   │   ├── Topbar.jsx        ← Header + notifications
│   │   └── TabBar.jsx        ← Tab navigation theo role
│   ├── sales/
│   │   ├── SalesView.jsx     ← Router cho KD
│   │   ├── LeadsView.jsx     ✅ Đầy đủ
│   │   ├── OrdersView.jsx    ✅ Đầy đủ (search + filter giá trị)
│   │   ├── OppsView.jsx      📋 Cơ bản
│   │   ├── MyCustView.jsx    📋 Stub
│   │   └── ReportView.jsx    📋 Stub
│   ├── ketoan/
│   │   └── KetoanView.jsx    ✅ Đầy đủ (approve/reject + payment)
│   ├── prod/
│   │   └── ProdView.jsx      ✅ Đầy đủ (late/done/defect)
│   ├── smgr/
│   │   └── SmgrView.jsx      📋 Cơ bản
│   ├── admin/
│   │   └── AdminView.jsx     📋 Dashboard + user list
│   ├── design/, kho/, mkt/   📋 Stub
│   └── shared/
│       ├── StubViews.jsx     ← Tất cả stub views
│       └── CskhView.jsx
```

---

## 🔑 Tài khoản demo (pass: 123456)

| Username | Role |
|---|---|
| nhanvien1/2/3 | sales |
| mkt1/2 | mkt |
| ketoan1 | ketoan |
| quanly1 | smgr |
| admin1 | admin |
| sanxuat1/2/3 | prod (NCC) |
| design1/2 | design |
| kho1 | kho |
| cskh1 | cskh |

---

## 📊 State Management (Zustand)

### useAuthStore
```js
const { user, login, logout, getUser, hasPerm } = useAuthStore();
```

### useDataStore
```js
const { leads, opps, orders, addOrder, ktApprove, markProdDone } = useDataStore();
```

### useUIStore
```js
const { activeTab, setTab, modal, openModal, closeModal } = useUIStore();
```

---

## 🔄 Data Persistence

Chế độ mặc định: **localStorage** (demo)

Để kết nối backend Node.js:
1. Sửa `store/index.js` → `useApi: true`
2. Các function `addOrder()`, `ktApprove()`, v.v. sẽ gọi `/api/*`
3. Đảm bảo backend đang chạy tại `localhost:3001`

---

## 📋 Trạng thái migrate

| Module | Trạng thái |
|---|---|
| Auth / Login | ✅ Hoàn chỉnh |
| Leads (KD) | ✅ Hoàn chỉnh |
| Orders (KD) | ✅ Hoàn chỉnh |
| Phê duyệt (KT) | ✅ Hoàn chỉnh |
| Tình trạng (NCC/Prod) | ✅ Hoàn chỉnh |
| Notifications | ✅ Zustand store |
| Cơ hội (KD) | 📋 Cơ bản |
| Khách hàng (KD) | 📋 Stub |
| SMGR / Báo giá | 📋 Cơ bản |
| Admin / Users | 📋 Cơ bản |
| Thiết kế / Kho / MKT | 📋 Stub |

Legend: ✅ Production-ready · 📋 Cần phát triển thêm
