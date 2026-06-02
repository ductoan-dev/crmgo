# CRMGO — Việc cần làm tiếp theo
> Cập nhật: 2026-05-29 | Tiếp tục từ session trước

---

## 🗂️ Tổng quan nhanh

| Layer | Trạng thái |
|---|---|
| Backend API (`crmgo_api/`) | ✅ Hoàn chỉnh (routes, services, models) |
| Frontend localStorage mode | ✅ Chạy được (demo) |
| Frontend ↔ API integration | ❌ Chưa làm |
| Các View còn stub/cơ bản | ❌ Cần hoàn thiện |

---

## 🔥 Ưu tiên cao — Làm trước

### 1. DesignView (`crmgo/src/components/design/DesignView.jsx`)
> Đang là stub. Account test: **design1** / 123456

Cần implement:
- [ ] Xem danh sách đơn hàng cần thiết kế (status = `design`)
- [ ] Upload / xem file thiết kế đính kèm
- [ ] Nút "Hoàn thành thiết kế" → chuyển đơn sang bước tiếp (kho/sản xuất)
- [ ] Xem ghi chú yêu cầu thiết kế từ sales/smgr

### 2. SmgrView đầy đủ (`crmgo/src/components/smgr/SmgrView.jsx`)
> Đang là cơ bản. Account test: **quanly1** / 123456

Cần implement:
- [ ] Tab **Báo giá**: tạo quote từ opportunity, gửi cho khách
- [ ] Tab **Giao NCC**: chọn nhà cung cấp cho đơn hàng
- [ ] Tab **Duyệt đơn**: approve/reject đơn từ sales
- [ ] Xem dashboard tổng quan (doanh số, đơn đang xử lý)

### 3. KhoView (`crmgo/src/components/kho/KhoView.jsx`)
> Đang là stub. Account test: **kho1** / 123456

Cần implement:
- [ ] Xem đơn hàng đang chờ xuất kho (status = `warehouse`)
- [ ] Nút "Xuất kho / Giao hàng" → cập nhật status → `delivered`
- [ ] Nhập kho nguyên vật liệu từ NCC
- [ ] Tồn kho cơ bản

---

## 🟡 Ưu tiên trung bình

### 4. MktView (`crmgo/src/components/mkt/MktView.jsx`)
> Account test: **mkt1** / 123456

- [ ] Quản lý campaigns (danh sách, thêm mới)
- [ ] Assign lead từ campaign → sales
- [ ] Báo cáo nguồn lead (from channel)

### 5. CskhView (`crmgo/src/components/shared/CskhView.jsx`)
> Account test: **cskh1** / 123456

- [ ] Xem danh sách khách hàng đã có đơn
- [ ] Ghi nhận phản hồi / khiếu nại
- [ ] Lịch sử giao dịch của từng khách

### 6. MyCustView & ReportView (Sales)
> `crmgo/src/components/sales/MyCustView.jsx` và `ReportView.jsx`

- [ ] MyCustView: danh sách khách hàng của sales đang login
- [ ] ReportView: doanh số cá nhân, tỷ lệ chuyển đổi lead → đơn

---

## 🔵 Ưu tiên thấp (sau khi views xong)

### 7. Frontend ↔ API Integration
> File chính: `crmgo/src/store/index.js`

Hiện tại `useApi: false` → chạy localStorage.  
Khi muốn kết nối backend thật:

```js
// store/index.js — đổi thành:
const useApi = true;
```

Các hàm cần viết API calls:
- [ ] `addLead()` → `POST /api/leads`
- [ ] `addOpp()` → `POST /api/opportunities`
- [ ] `addOrder()` → `POST /api/orders`
- [ ] `ktApprove()` → `PATCH /api/orders/:id/workflow`
- [ ] `markProdDone()` → `PATCH /api/orders/:id/workflow`
- [ ] Tất cả `fetch` đều cần header: `Authorization: Bearer <token>`

### 8. Database Seed Script
- [ ] Tạo `crmgo_api/seeders/seed.js` với dữ liệu mẫu (users, leads, orders)
- [ ] Chạy: `node seeders/seed.js`

### 9. File/Image Upload
- [ ] Thêm `multer` vào API để nhận file
- [ ] Endpoint: `POST /api/orders/:id/files`
- [ ] Frontend: input type=file trong DesignView / OrdersView

### 10. Real-time Notifications (WebSocket)
- [ ] Thêm `socket.io` vào `crmgo_api/`
- [ ] Emit event khi order đổi status
- [ ] Frontend: listen và hiện toast / badge

---

## 🛠️ Cách khởi động lại

```bash
# Terminal 1 — Backend
cd D:\CRMGO\crmgo_demo\crmgo_api
npm run dev
# → http://localhost:3001

# Terminal 2 — Frontend
cd D:\CRMGO\crmgo_demo\crmgo
npm run dev
# → http://localhost:5173
```

### Tài khoản demo (pass: 123456)
| Username | Role | View cần test |
|---|---|---|
| nhanvien1 | sales | LeadsView, OrdersView, OppsView |
| quanly1 | smgr | SmgrView |
| ketoan1 | ketoan | KetoanView |
| design1 | design | **DesignView** ← làm tiếp |
| kho1 | kho | KhoView |
| mkt1 | mkt | MktView |
| cskh1 | cskh | CskhView |
| sanxuat1 | prod | ProdView |
| admin1 | admin | AdminView |

---

## 📝 Ghi chú từ session trước

- Backend API **đã hoàn chỉnh** — không cần sửa, chỉ cần test khi integration
- Workflow đơn hàng: Lead → Cơ hội → Báo giá → Đơn hàng → KT duyệt → **Thiết kế** → NCC sản xuất → Kho → Giao hàng
- Transitions nằm ở `crmgo_api/services/order.service.js` → `WF_TRANSITIONS`
- CSS variables và styles dùng chung: `crmgo/src/styles/globals.css`
- Nên làm **DesignView** trước vì nó nằm ngay giữa workflow và đang là stub hoàn toàn

## 📌 Session 2026-05-29 — Làm tiếp ngày mai

- **Bắt đầu từ SmgrView** (`crmgo/src/components/smgr/SmgrView.jsx`) — account test: **quanly1** / 123456
- Ưu tiên triển khai theo thứ tự:
  1. SmgrView: Tab Báo giá + Tab Duyệt đơn (cốt lõi nhất)
  2. DesignView: hiện vẫn là stub hoàn toàn
  3. KhoView: sau khi Design xong thì kho mới nhận được đơn

---

## 📌 Session 2026-06-01 — Làm tiếp ngày mai

### ✅ Đã hoàn thành hôm nay

**Luồng thông báo NCC báo giá "In nhanh" trong 24h:**
- `ProdView.jsx` — Popup cảnh báo khi NCC đăng nhập (1 lần/ngày, localStorage key theo username+date)
- `store/index.js` — `checkNccQuoteDeadline(user, { force })` chạy cho cả `prod` và `smgr`; field riêng `nccQuoteOverdueAt` / `smgrNccAlertAt` để throttle độc lập
- `AppShell.jsx` — Hook vào chu kỳ check 15 phút
- `Topbar.jsx` — Filter thông báo theo `forSupplier`; styling vàng cam cho `ncc_quote_overdue`
- `SmgrView.jsx` — Badge loại đơn (màu theo CAT_CLR), badge "⚡ Giao gấp — 24h", alert banner + nút "🧪 Test thông báo", đồng hồ đếm giờ trên row báo giá
- `constants.js` — Thêm `NCC_QUOTE_DEADLINE_HOURS`, `NCC_QUOTE_RESEND_HOURS` + test mode flag
- `AddOrderModal.jsx` — Dropdown loại đơn dùng `CATS` (không còn `ORDER_TYPES`), bỏ override `orderType` trong `handleOppChange`

**Fix bug orderType không lưu đúng:**
- Root cause: DB `orders.type` là `ENUM('in-an','thiet-ke',...)` → từ chối CATS values ('In nhanh', 'Offset'...)
- `crmgo_api/src/db/models/Order.js` — Đổi `ENUM` → `STRING(100)`, default `'In nhanh'`
- `crmgo_api/src/db/migrations/20240101000013-alter-orders-type-varchar.js` — Migration ALTER TABLE
- `crmgo/src/utils/api.js` — `toApiOrder` ưu tiên `f.orderType`, fallback `'In nhanh'`; `fromApiOrder` normalize old values
- `crmgo/src/store/index.js` — Normalize `ORDER_TYPE_NORM` khi load từ localStorage (`'in-an'` → `'In nhanh'`, v.v.)

### ⚠️ CẦN LÀM NGAY KHI BẮT ĐẦU

1. **Restart backend** để Sequelize `alter: true` đổi ENUM → VARCHAR:
   ```
   cd crmgo_api && npm run dev
   ```
   hoặc chạy migration trực tiếp:
   ```
   cd crmgo_api && npx sequelize-cli db:migrate
   ```

2. **Kiểm tra `ProdView.jsx`** — file đang import `ProductView from './ProductView'` (dòng 6) nhưng file đó **chưa tồn tại** → cần tạo hoặc xoá import này trước khi test

### 📋 Việc còn lại (chưa làm)

- **DesignView** — vẫn là stub hoàn toàn (`crmgo/src/components/design/DesignView.jsx`)
- **KhoView** — chờ DesignView xong
- Test end-to-end luồng: tạo đơn In nhanh → KT duyệt → SMGR giao NCC → NCC báo giá → xác nhận popup/chuông hoạt động đúng
- Xem xét thêm thông báo Email/Zalo thật (hiện chỉ có in-app notification)

### 🔑 Account test

| Username | Role | Mục đích |
|---|---|---|
| nhanvien1 | sales | Tạo đơn |
| ketoan1 | ketoan | Duyệt đơn |
| quanly1 | smgr | Giao NCC, test thông báo |
| sanxuat1 | prod | NCC nhận đơn, báo giá (supplier: Công ty In Tân Tiến) |

---

## 📌 Session 2026-06-01 (buổi chiều) — Đã làm thêm

### ✅ Hoàn thành trong session này

**1. Tách layer Services — Refactor kiến trúc frontend**

Tách `store/index.js` (879 dòng, làm tất cả) thành 3 layer rõ ràng:

- `crmgo/src/utils/mappers.js` ← **MỚI**: toàn bộ field mappers (toApiLead, fromApiOrder, ...)
- `crmgo/src/services/leadService.js` ← **MỚI**: addLead, convertLead, checkOverdueLeads, ...
- `crmgo/src/services/orderService.js` ← **MỚI**: ktApprove, smgrAssignNcc, recordPayment, checkOverdueOrders, checkNccQuoteDeadline, ...
- `crmgo/src/services/oppService.js` ← **MỚI**: addOpp, updateOpp
- `crmgo/src/utils/api.js` — chỉ còn HTTP client + tokenStore + endpoints (bỏ mapper)
- `crmgo/src/store/index.js` — thin wrappers gọi services, cập nhật state (240 dòng thay vì 879)

> JSX components và backend **không thay đổi**. Logic hoạt động giữ nguyên hoàn toàn.

**2. CskhView — Thiết kế lại theo nghiệp vụ CSKH**

File: `crmgo/src/components/shared/CskhView.jsx`

- **Tạo Lead** (`CreateLeadModal`): form đầy đủ (loại khách, ngành, ngân sách, thời điểm cần, chân dung, kênh) + đính kèm file/link
- **Chỉnh sửa Lead** (`EditLeadModal`): layout 2 cột giống code cũ, ô trạng thái có thể chỉnh
- **Panel Chi tiết** (`LeadDetailPanel`): xem thông tin + quản lý đính kèm, trạng thái LH read-only
- **Bảng danh sách**: xem toàn bộ lead (không filter theo user), 2 nút hành động mỗi row (Chi tiết / Chỉnh sửa)
- **KPI strip**: Tổng / Chưa LH / Đang theo dõi / Không LH được / Đã chuyển CH / Có tài liệu
- **Bộ lọc**: tìm kiếm + nhiệt độ + trạng thái + KD phụ trách

**3. Auto-assign KD — Logic phân công tự động**

Hàm `autoAssignKd()` trong CskhView, 3 case:

| Case | Badge | Kết quả |
|---|---|---|
| Lead cũ, KD có đơn < 18 tháng | 🔁 Giữ KD | Giữ nguyên KD cũ |
| Lead cũ, KD không có đơn > 18 tháng | 🔄 Tái phân | Round-robin KD mới, ghi lý do |
| Lead mới 100% | 🆕 Phân mới | Round-robin KD ít lead nhất |

CSKH xem được gợi ý + lý do, có thể override thủ công nếu cần.

**4. Push code lên GitHub**

Repository: `https://github.com/ductoan-dev/crmgo.git`
- Xoá `.git` riêng của `crmgo/` (embedded git repo)
- Tạo `.gitignore` root + `crmgo_api/.gitignore` (bảo vệ `.env`)
- Commit 112 files: frontend + backend + docker-compose

### ✅ Hoàn thành session 2026-06-01 (buổi tối)

**DesignView** (`crmgo/src/components/design/DesignView.jsx`):
- Tab "Đơn thiết kế": KPI strip, filter chips, danh sách order cards
- Button "Nhận đơn thiết kế" (kt_approved → in_design)
- Button "Hoàn thành thiết kế" + popup ghi chú (in_design → design_done)
- Hiển thị yêu cầu từ Sales (thongtin) + ghi chú từ SMGR (smgrNote)
- Tab "Phân công": bảng workload theo designer

**KhoView** (`crmgo/src/components/kho/KhoView.jsx`):
- Tab "Đơn hàng": KPI strip, filter chips, danh sách order cards
- Button "Xuất kho / Giao hàng" + popup ghi chú (in_warehouse → delivered)
- Tab "Tồn kho": stats tháng này + phân nhóm hàng theo NCC

**orderService.js** — thêm 3 functions:
- `designAccept()` → in_design
- `designComplete()` → design_done
- `khoDeliver()` → delivered

**store/index.js** — thêm 3 actions: `designAccept`, `designComplete`, `khoDeliver` (có push notification + wfHistory)

**Fix**: `ProdView.jsx` import `ProductView` — file đã tồn tại sẵn, không cần sửa.

### 📋 Việc còn lại (chưa làm)

- **Auto-assign KD nâng cao**: chia theo thế mạnh KD theo sản phẩm/doanh thu (cần thống kê đơn hàng theo từng KD × loại sản phẩm)
- **CskhView**: chưa có chức năng xem lịch sử giao dịch của từng khách hàng
- Test end-to-end workflow đầy đủ: Tạo đơn → KT duyệt → Design nhận → Design xong → SMGR giao NCC → NCC sản xuất → Kho → Giao hàng

---

## 📌 Session 2026-06-01 (buổi tối muộn) — LeadsView refactor

### ✅ Hoàn thành

**LeadsView** (`crmgo/src/components/sales/LeadsView.jsx`) — refactor theo nghiệp vụ:

**1. Lọc lead theo phân quyền**
- KD thường: chỉ thấy lead được giao cho mình (`assignedTo === user.name`)
- `role === 'admin'` hoặc `isLeader === true`: thấy toàn bộ lead (hiển thị badge "Chế độ xem toàn bộ")

**2. Cột "Nhân viên" ẩn/hiện động**
- Ẩn với KD thường, chỉ hiện khi `canSeeAll`
- `gridTemplateColumns` điều chỉnh tự động (11 cột ↔ 10 cột)

**3. Popup "👁 Chi tiết" — xem thông tin khách hàng (read-only)**
- Hiển thị đầy đủ: thông tin KH, thông tin KD (ngân sách, thời điểm, ưu tiên, chân dung KH), ghi chú
- Lịch sử CSKH (`cskhCalls`) chỉ đọc — không có nút xoá/sửa + ghi chú nhắc nhở
- Button "📋 Tạo đơn" chuyển vào trong popup này

**4. Cột hành động mới (2 button)**
- `👁 Chi tiết` → mở `LeadDetailPopup`
- `🎯 Tạo cơ hội` → mở `AddOppModal` (badge "✅ Đã CH" nếu đã chuyển)

### 📋 Việc còn lại

- **LeadsView — Edit lead**: chưa có chức năng sửa thông tin cơ bản của lead (tên, SĐT, sản phẩm, nhiệt độ...) từ màn Sales — cần thêm form sửa trong `LeadDetailPopup` hoặc modal riêng
- **isLeader flag**: chưa có account demo nào có `isLeader: true` trong `DEMO_ACCOUNTS` (constants.js) — cần thêm account "Trưởng nhóm KD" để test `canSeeAll`

---

## 📌 Session 2026-06-01 (buổi tối muộn #2) — Supplier fields

### ✅ Hoàn thành

**Thêm trường thông tin NCC** — 5 file thay đổi:

**Backend:**
- `crmgo_api/src/db/migrations/20240101000015-add-supplier-fields.js` ← **MỚI**
  - ALTER TABLE suppliers: thêm `company`, `tax_code`, `workshop_address`, `rating_pros`, `rating_cons`
- `crmgo_api/src/db/models/Supplier.js` — thêm 5 DataTypes tương ứng

**Frontend:**
- `crmgo/src/store/index.js` — `addSupplier()` lưu đủ 5 trường mới
- `crmgo/src/components/smgr/SmgrView.jsx`:
  - `SupplierForm`: thêm section **🏢 Thông tin pháp lý** (Tên cty/HKD, MST, Địa chỉ xưởng) + section **⭐ Đánh giá NCC** (Ưu điểm / Nhược điểm)
  - `SupplierCard`: hiển thị company, MST (badge tím), địa chỉ xưởng (🏭), box xanh Ưu điểm, box đỏ Nhược điểm

### ⚠️ Cần chạy migration khi bắt đầu

```
cd crmgo_api
pnpm exec sequelize-cli db:migrate
```

> Lỗi thường gặp: dùng `npx` thay vì `pnpm exec` → báo lỗi `EBADDEVENGINES` vì project dùng pnpm

### 📋 Việc còn lại

- `updateSupplier` trong store chưa map các trường mới khi chỉnh sửa (hiện chỉ spread `data` vào state nên vẫn hoạt động, nhưng nên explicit)
- Supplier API mapper (`toApiSupplier` / `fromApiSupplier`) chưa có trong `mappers.js` — cần thêm khi làm API integration
