# CRMGO API – Thiết kế MVC

## Cấu trúc thư mục

```
crmgo_api/
├── server.js
└── src/
    ├── config/
    │   └── database.js
    ├── models/
    │   ├── index.js           ← Liên kết tất cả bảng (associations)
    │   ├── User.js
    │   ├── Business.js
    │   ├── Lead.js
    │   ├── Opportunity.js
    │   ├── Quote.js
    │   ├── Order.js
    │   ├── OrderItem.js
    │   ├── OrderWorkflow.js
    │   ├── Supplier.js
    │   ├── SupplierOrder.js
    │   └── Notification.js
    ├── controllers/           ← Chưa tạo
    ├── routes/                ← Chưa tạo
    ├── services/              ← Chưa tạo
    ├── middleware/            ← Chưa tạo
    └── utils/
        ├── constants.js
        └── helpers.js
```

---

## Sơ đồ quan hệ bảng (ERD)

```
User ──────────┬── hasMany Lead              (sales/mkt phụ trách lead)
               ├── hasMany Opportunity       (sales phụ trách cơ hội)
               ├── hasMany Order             (sales tạo đơn hàng)
               ├── hasMany Quote             (sales tạo báo giá)
               ├── hasMany Business          (ai tạo hồ sơ khách hàng)
               ├── hasOne  Supplier          (prod user ↔ nhà cung cấp)
               ├── hasMany OrderWorkflow     (ai thực hiện bước workflow)
               ├── hasMany SupplierOrder     (smgr gửi đơn cho NCC)
               └── hasMany Notification      (thông báo tới user)

Business ──────┬── hasMany Lead
               ├── hasMany Opportunity
               └── hasMany Order

Lead ──────────── hasMany Opportunity        (1 lead → nhiều cơ hội)

Opportunity ───┬── hasMany Quote             (nhiều lần báo giá)
               └── hasMany Order             (khi chốt đơn → tạo order)

Quote ─────────── hasMany Order              (order dùng quote nào làm cơ sở)

Order ──────────┬── hasMany OrderItem        (sản phẩm trong đơn)
                ├── hasMany OrderWorkflow    (lịch sử chuyển trạng thái)
                └── hasMany SupplierOrder    (đơn gửi cho từng NCC)

Supplier ──────┬── hasMany OrderItem         (NCC xử lý item nào)
               └── hasMany SupplierOrder
```

---

## Chi tiết từng Model

### User
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INT UNSIGNED PK | |
| username | STRING(50) UNIQUE | |
| name | STRING(100) | Tên hiển thị |
| password_hash | STRING(255) | Bcrypt |
| role | ENUM | sales, mkt, cskh, ketoan, design, kho, smgr, prod, admin |
| is_leader | BOOLEAN | Trưởng nhóm |
| permissions | JSON | Quyền hạn tuỳ chỉnh |
| is_active | BOOLEAN | |

### Business (Khách hàng doanh nghiệp)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INT UNSIGNED PK | |
| name | STRING(200) | Tên công ty |
| phone | STRING(20) | |
| email | STRING(100) | |
| address | TEXT | |
| industry | STRING(100) | Ngành nghề |
| tax_code | STRING(20) | Mã số thuế |
| note | TEXT | |
| created_by | FK → User | |

### Lead (Khách hàng tiềm năng)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INT UNSIGNED PK | |
| code | STRING(20) UNIQUE | LEADMMDDxxxx |
| customer_name | STRING(150) | |
| phone | STRING(20) | |
| email | STRING(100) | |
| contact_status | ENUM | chua_lh, da_lh, dat_hen, ko_nghe, ko_trien, da_chuyen |
| temperature | ENUM | hot, warm, cold |
| source | STRING(100) | Nguồn tiếp cận |
| note | TEXT | |
| emp_id | FK → User | Sales/MKT phụ trách |
| business_id | FK → Business | Nullable |

### Opportunity (Cơ hội bán hàng)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INT UNSIGNED PK | |
| code | STRING(20) UNIQUE | OPPMMDDxxxx |
| customer_name | STRING(150) | |
| status | TINYINT | 0=Tiếp cận → 7=Đã TT |
| kha_nang | TINYINT | Xác suất chốt 0–100% |
| images | JSON | |
| note | TEXT | |
| lead_id | FK → Lead | Nullable (chuyển từ lead) |
| business_id | FK → Business | Nullable |
| emp_id | FK → User | Sales phụ trách |

**Trạng thái Opportunity:**
| Giá trị | Ý nghĩa |
|---------|---------|
| 0 | Tiếp cận |
| 1 | Đã tư vấn |
| 2 | Chốt đơn |
| 3 | Không tiếp tục |
| 4 | Hủy đơn |
| 5 | Tạm dừng |
| 6 | Chờ thanh toán |
| 7 | Đã thanh toán |

### Quote (Báo giá)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INT UNSIGNED PK | |
| items | JSON | Danh sách sản phẩm báo giá |
| total | DECIMAL(15,0) | Tổng tiền |
| version | TINYINT | Phiên bản báo giá |
| note | TEXT | |
| opp_id | FK → Opportunity | |
| created_by | FK → User | |

### Order (Đơn hàng)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INT UNSIGNED PK | |
| code | STRING(20) UNIQUE | ORDMMDDxxxx |
| type | ENUM | in-an, thiet-ke, lam-mau, ban-le |
| status | ENUM | Workflow status (8 bước) |
| customer_name | STRING(150) | |
| total | DECIMAL(15,0) | |
| deposit | DECIMAL(15,0) | Tiền đặt cọc |
| deadline | DATE | |
| note | TEXT | |
| opp_id | FK → Opportunity | |
| quote_id | FK → Quote | Nullable |
| emp_id | FK → User | Sales tạo đơn |
| business_id | FK → Business | Nullable |

### OrderItem (Sản phẩm trong đơn)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INT UNSIGNED PK | |
| name | STRING(200) | Tên sản phẩm |
| category | ENUM | Thiết kế, In nhanh, Offset, Hộp sóng... |
| qty | INT UNSIGNED | Số lượng |
| unit_price | DECIMAL(15,0) | Đơn giá |
| total | DECIMAL(15,0) | Thành tiền |
| specs | JSON | Thông số kỹ thuật |
| status | ENUM | pending, in_design, design_done, in_production, done, error |
| note | TEXT | |
| order_id | FK → Order | |
| supplier_id | FK → Supplier | Nullable – NCC xử lý item này |

### OrderWorkflow (Lịch sử trạng thái đơn hàng)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INT UNSIGNED PK | |
| from_status | STRING(50) | Trạng thái trước |
| to_status | STRING(50) | Trạng thái sau |
| note | TEXT | Ghi chú khi chuyển |
| order_id | FK → Order | |
| actor_id | FK → User | Ai thực hiện |

### Supplier (Nhà cung cấp)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INT UNSIGNED PK | |
| name | STRING(150) | Tên NCC |
| cats | JSON | Danh mục sản phẩm xử lý |
| phone | STRING(20) | |
| email | STRING(100) | |
| address | TEXT | |
| is_active | BOOLEAN | |
| user_id | FK → User | Tài khoản prod của NCC |

### SupplierOrder (Đơn giao cho NCC)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INT UNSIGNED PK | |
| items | JSON | Chi tiết sản phẩm giao |
| total | DECIMAL(15,0) | |
| status | ENUM | sent, confirmed, in_production, done, error |
| note | TEXT | |
| error_note | TEXT | Mô tả lỗi nếu có |
| deadline | DATE | |
| order_id | FK → Order | |
| supplier_id | FK → Supplier | |
| sent_by | FK → User | smgr gửi |

### Notification (Thông báo)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INT UNSIGNED PK | |
| type | STRING(50) | lead_assigned, order_status, kt_approved... |
| title | STRING(200) | |
| message | TEXT | |
| ref_type | STRING(20) | Loại entity: lead, order, opp... |
| ref_id | INT UNSIGNED | ID entity liên quan |
| is_read | BOOLEAN | |
| user_id | FK → User | Người nhận |

---

## Luồng Workflow theo Role

```
[sales/mkt]  Tạo Lead
      ↓
[sales]      Chuyển Lead → Opportunity  (contact_status = da_chuyen)
      ↓
[sales]      Tạo Quote cho Opportunity  (version 1, 2, 3...)
      ↓
[sales]      Chốt đơn → Tạo Order       (opp.status = 2, order.status = pending_kt)
      ↓
[ketoan]     Duyệt đơn                  (order.status = kt_approved)
      ↓
[design]     Nhận & xử lý thiết kế      (order.status = in_design → design_done)
      ↓
[smgr]       Giao sản xuất cho NCC      (order.status = in_production)
             Tạo SupplierOrder           (supplier_order.status = sent)
      ↓
[prod/NCC]   Xác nhận & sản xuất        (supplier_order.status = confirmed → done)
             Order cập nhật              (order.status = supplier_sent)
      ↓
[kho]        Nhận hàng vào kho          (order.status = in_warehouse)
      ↓
[sales/kho]  Giao hàng cho khách        (order.status = delivered)
             Opp cập nhật               (opp.status = 7 – Đã TT)
```

---

## API Routes (kế hoạch)

| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| POST | /api/auth/login | * | Đăng nhập |
| GET | /api/auth/me | * | Thông tin user hiện tại |
| GET | /api/users | admin | Danh sách users |
| POST | /api/users | admin | Tạo user |
| GET | /api/leads | sales, mkt, admin | Danh sách leads |
| POST | /api/leads | sales, mkt | Tạo lead |
| PATCH | /api/leads/:id | sales, mkt | Cập nhật lead |
| POST | /api/leads/:id/convert | sales | Chuyển lead → opp |
| GET | /api/opportunities | sales, admin | Danh sách opps |
| POST | /api/opportunities | sales | Tạo opp |
| PATCH | /api/opportunities/:id | sales | Cập nhật opp |
| GET | /api/opportunities/:id/quotes | sales | Lịch sử báo giá |
| POST | /api/opportunities/:id/quotes | sales | Thêm báo giá |
| GET | /api/orders | * | Danh sách đơn (theo role) |
| POST | /api/orders | sales | Tạo đơn hàng |
| PATCH | /api/orders/:id/status | * | Chuyển trạng thái |
| GET | /api/orders/:id/workflow | * | Lịch sử workflow |
| GET | /api/suppliers | smgr, admin | Danh sách NCC |
| POST | /api/suppliers | admin | Tạo NCC |
| POST | /api/orders/:id/supplier-orders | smgr | Giao đơn cho NCC |
| PATCH | /api/supplier-orders/:id/status | prod, smgr | Cập nhật trạng thái NCC |
| GET | /api/businesses | sales, admin | Danh sách khách hàng |
| POST | /api/businesses | sales | Tạo khách hàng |
| GET | /api/notifications | * | Thông báo của user |
| PATCH | /api/notifications/:id/read | * | Đánh dấu đã đọc |
