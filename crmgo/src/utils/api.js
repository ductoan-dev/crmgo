// ══ CRMGO API Service ══════════════════════════════════════════
// Access token  : 15 phút, lưu trong memory (Zustand)
// Refresh token : 7 ngày,  lưu trong localStorage
// Auto-refresh  : khi nhận 401, tự gọi /auth/refresh rồi retry

const BASE = '/api';

// ── Token storage ─────────────────────────────────────────────
// Access token: memory (primary) + sessionStorage (backup chống HMR reset)
// Refresh token: localStorage (tồn tại qua session)
let _accessToken = null;

export const tokenStore = {
  setAccess: (t) => {
    _accessToken = t;
    // sessionStorage backup: sống qua Vite HMR module reset, xóa khi đóng tab
    if (t) sessionStorage.setItem('crmgo_at', t);
    else   sessionStorage.removeItem('crmgo_at');
  },
  // Đọc từ memory trước, fallback sessionStorage nếu module bị HMR reset
  getAccess: () => _accessToken || sessionStorage.getItem('crmgo_at') || null,
  clearAccess: () => {
    _accessToken = null;
    sessionStorage.removeItem('crmgo_at');
  },

  setRefresh:  (t) => localStorage.setItem('crmgo_refresh', t),
  getRefresh:  ()  => localStorage.getItem('crmgo_refresh'),
  clearRefresh:()  => localStorage.removeItem('crmgo_refresh'),

  clearAll: () => {
    _accessToken = null;
    sessionStorage.removeItem('crmgo_at');
    localStorage.removeItem('crmgo_refresh');
    localStorage.removeItem('crmgo_token'); // tương thích ngược
  },
};

// ── Đang refresh (tránh gọi nhiều lần cùng lúc) ───────────────
let _refreshing     = false;
let _refreshQueue   = [];   // { resolve, reject }

const processQueue = (err, token = null) => {
  _refreshQueue.forEach(({ resolve, reject }) =>
    err ? reject(err) : resolve(token)
  );
  _refreshQueue = [];
};

// ── Gọi /auth/refresh ─────────────────────────────────────────
async function doRefresh() {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) throw new Error('No refresh token');

  const res  = await fetch(`${BASE}/auth/refresh`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refreshToken }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Refresh failed');

  // Lưu token mới (rotation)
  tokenStore.setAccess(json.data.accessToken);
  tokenStore.setRefresh(json.data.refreshToken);
  return json.data.accessToken;
}

// ── HTTP helper với auto-refresh ──────────────────────────────
async function req(method, path, body = null, isRetry = false) {
  const headers = { 'Content-Type': 'application/json' };
  const token   = tokenStore.getAccess();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res  = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // ── 401 → thử refresh rồi retry 1 lần ────────────────────
  // KHÔNG auto-refresh với /auth/* (login, refresh, logout tự xử lý 401)
  const isAuthPath = path.startsWith('/auth/');
  if (res.status === 401 && !isRetry && !isAuthPath) {
    if (_refreshing) {
      // Chờ refresh đang chạy xong, rồi retry
      return new Promise((resolve, reject) => {
        _refreshQueue.push({ resolve, reject });
      }).then(newToken => {
        const retryHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${newToken}` };
        return fetch(BASE + path, { method, headers: retryHeaders, body: body ? JSON.stringify(body) : undefined })
          .then(r => r.json().then(j => { if (!r.ok) throw new Error(j.message); return j.data ?? j; }));
      });
    }

    _refreshing = true;
    try {
      const newToken = await doRefresh();
      processQueue(null, newToken);
      _refreshing = false;
      return req(method, path, body, true); // retry với access token mới
    } catch (refreshErr) {
      processQueue(refreshErr);
      _refreshing = false;
      tokenStore.clearAll();
      // Dispatch event để App.jsx biết cần logout
      window.dispatchEvent(new CustomEvent('crmgo:session-expired'));
      throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
    }
  }

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json.data ?? json;
}

// ── Field mappers — Frontend ↔ Backend ───────────────────────

/** Lead: frontend → DB */
export const toApiLead = (f) => ({
  customer_name:  f.name,
  phone:          f.phone   || null,
  email:          f.email   || null,
  contact_status: f.contactStatus || 'chua_lh',
  temperature:    f.temp    || 'warm',
  source:         f.channel || null,
  area:           f.area    || null,
  note: [
    f.note,
    f.product  && `SP: ${f.product}`,
    f.chandung?.length && `Profile: ${f.chandung.join(',')}`,
  ].filter(Boolean).join('\n') || null,
});

/** Business: DB → frontend */
export const fromApiBusiness = (d) => ({
  id:        d.id,
  name:      d.name,
  phone:     d.phone    || '',
  email:     d.email    || '',
  address:   d.address  || '',
  industry:  d.industry || '',
  taxCode:   d.tax_code || '',
  note:      d.note     || '',
  createdBy: d.creator?.name || '',
  createdAt: d.created_at ? new Date(d.created_at) : new Date(),
});

/** Lead: DB → frontend */
export const fromApiLead = (d) => ({
  id:            d.id,
  code:          d.code,
  name:          d.customer_name,
  phone:         d.phone   || '',
  email:         d.email   || '',
  company:       d.business?.name || '',
  businessId:    d.business_id    || null,
  contactStatus: d.contact_status  || 'chua_lh',
  temp:          d.temperature     || 'warm',
  channel:       d.source || '',
  area:          d.area   || '',
  note:          d.note   || '',
  // emp = người tạo lead (emp_id), không thay đổi sau transfer
  emp:           d.emp?.name || '',
  // transferredTo = KD được chuyển sang (transferred_to_id)
  transferredTo: d.transferredTo?.name || null,
  // assignedTo: KD được nhận nếu đã transfer, ngược lại là người tạo
  assignedTo:    d.transferredTo?.name || d.emp?.name || '',
  chandung:      [],
  createdAt:     d.created_at ? new Date(d.created_at) : new Date(),
});

/** Opportunity: frontend → DB */
export const toApiOpp = (f) => ({
  customer_name: f.customerName || f.khachHang || f.name || '',
  status:        f.status ?? 0,
  kha_nang:      f.khaNang ?? 50,
  note:          f.note || null,
  lead_id:       f.leadId || f.fromLeadId || null,  // fix: map cả fromLeadId
  business_id:   f.businessId  || null,
});

/** Opportunity: DB → frontend */
export const fromApiOpp = (d) => ({
  id:           d.id,
  code:         d.code,
  customerName: d.customer_name,
  khachHang:    d.customer_name,
  name:         d.customer_name,
  status:       d.status ?? 0,
  khaNang:      d.kha_nang ?? 50,
  note:         d.note || '',
  leadId:       d.lead_id,
  businessId:   d.business_id || null,
  quotes:       d.quotes || [],
  images:       d.images || [],
  emp:          d.emp?.name || '',        // ← dùng cho filter OppsView
  assignedTo:   d.emp?.name || '',
  dateObj:      d.created_at ? new Date(d.created_at) : new Date(),
  dateStr:      new Date(d.created_at || Date.now()).toLocaleDateString('vi-VN'),
  timeStr:      new Date(d.created_at || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
});

/** Order: frontend → DB */
export const toApiOrder = (f) => ({
  customer_name: f.customerName || f.name || '',
  type:          f.orderType || f.type || 'In nhanh',
  total:         f.grandTotal || f.total || 0,
  deposit:       f.deposit || 0,
  note:          f.note || null,
  deadline:      f.deadline || null,
  opp_id:        f.oppId || null,
  items: (f.lines || []).map(l => ({
    name:       l.name       || '',
    category:   l.cat        || null,
    qty:        l.qty        || 1,
    unit_price: l.price      || 0,
    total:      (l.qty || 1) * (l.price || 0),
    specs:      l.unit ? { unit: l.unit } : {},
  })),
});

/** Order: DB → frontend */
export const fromApiOrder = (d) => {
  const wfStatus = d.status || 'pending_kt';
  // ktApproved = true nếu đơn đã qua bước pending_kt (bất kể bước hiện tại là gì)
  const KT_APPROVED_STATUSES = [
    'kt_approved','in_design','design_done',
    'in_production','supplier_sent','in_warehouse','delivered',
  ];
  const ktApproved = KT_APPROVED_STATUSES.includes(wfStatus);
  // Lấy thông tin người duyệt từ workflow history nếu có
  const ktEntry = (d.workflow || []).find(w => w.to_status === 'kt_approved');
  return {
    id:            d.id,
    code:          d.code,
    customerName:  d.customer_name,
    name:          d.customer_name,        // alias — OrdersView dùng ord.name
    type:          d.type,
    orderType:     ({ 'in-an':'In nhanh','thiet-ke':'Thiết kế','lam-mau':'Làm mẫu','ban-le':'Bán lẻ' }[d.type] || d.type),
    grandTotal:    Number(d.total)   || 0,
    total:         Number(d.total)   || 0,
    deposit:       Number(d.deposit) || 0,
    note:          d.note   || '',
    wfStatus,
    status:        'Mới',
    oppId:         d.opp_id,
    emp:           d.emp?.name || '',
    // ── KT approval fields ───────────────────────────────────────
    ktApproved,
    ktApprovedBy:  ktEntry?.actor?.name || (ktApproved ? '(KT)' : ''),
    ktApprovedAt:  ktEntry?.created_at  || '',
    ktPaidAmount:  Number(d.kt_paid_amount) || 0,
    ktRejected:    d.kt_rejected    || false,
    ktRejectNote:  d.kt_reject_note || '',
    // ── Lines ───────────────────────────────────────────────────
    lines:         (d.items || []).map(i => ({
      id:    i.id,
      name:  i.name,
      cat:   i.category,
      qty:   i.qty,
      unit:  i.specs?.unit || 'cái',
      price: Number(i.unit_price) || 0,
    })),
    wfHistory:     d.workflow || [],
    createdAt:     d.created_at ? new Date(d.created_at) : new Date(),
    dateStr:       new Date(d.created_at || Date.now()).toLocaleDateString('vi-VN'),
    // ── SMGR fields ──────────────────────────────────────────
    smgrNccName:    d.smgr_ncc_name    || '',
    smgrExpectDate: d.smgr_expect_date || '',
    quycach:        d.quycach          || '',
    diadiem:        d.diadiem          || '',
    khaNang:        d.kha_nang         ?? 50,
    // ── Prod / NCC fields ────────────────────────────────────
    nccQuotePrice:  Number(d.ncc_quote_price) || 0,
    nccQuoteNote:   d.ncc_quote_note   || '',
    nccQuotedBy:    d.ncc_quoted_by    || '',
    nccQuotedAt:    d.ncc_quoted_at    || '',
    defect:         d.defect           || false,
    isDefect:       d.defect           || false,
    defectNote:     d.defect_note      || '',
  };
};

// ── API endpoints ─────────────────────────────────────────────
export const api = {
  auth: {
    login:   (username, password) => req('POST', '/auth/login',   { username, password }),
    refresh: (refreshToken)       => req('POST', '/auth/refresh', { refreshToken }),
    logout:  ()                   => req('POST', '/auth/logout'),
    me:      ()                   => req('GET',  '/auth/me'),
  },

  leads: {
    getAll:  ()             => req('GET',    '/leads'),
    create:  (data)         => req('POST',   '/leads',            toApiLead(data)),
    update:  (id, data)     => req('PUT',    `/leads/${id}`,      data),
    remove:  (id)           => req('DELETE', `/leads/${id}`),
    // transfer: MKT chuyển lead sang KD (cập nhật emp_id trong DB)
    transfer: (id, username) => req('POST', `/leads/${id}/transfer`, { username }),
    // convert: tạo Business + Opportunity + đánh dấu lead đã chuyển
    convert: (id, body = {}) => req('POST',  `/leads/${id}/convert`, body),
  },

  opps: {
    getAll:  ()         => req('GET',  '/opportunities'),
    create:  (data)     => req('POST', '/opportunities',       toApiOpp(data)),
    update:  (id, data) => req('PUT',  `/opportunities/${id}`, data),
  },

  orders: {
    getAll:   ()            => req('GET',  '/orders'),
    create:   (data)        => req('POST', '/orders',              toApiOrder(data)),
    update:   (id, data)    => req('PUT',  `/orders/${id}`,        data),
    // Advance workflow — dùng endpoint riêng, không cần quyền sales/admin
    advance:       (id, note='')   => req('POST', `/orders/${id}/advance`,        { note }),
    // SMGR: giao đơn cho NCC
    smgrAssign:    (id, data)      => req('POST',  `/orders/${id}/smgr-assign`,   data),
    // Prod-specific: NCC cập nhật quote/defect fields
    prodFields:    (id, data)      => req('PATCH', `/orders/${id}/prod-fields`,   data),
    // KT-specific: ketoan có quyền, không cần sales/admin
    recordPayment: (id, amount)    => req('POST', `/orders/${id}/record-payment`, { amount }),
    reject:        (id, reason='') => req('POST', `/orders/${id}/reject`,         { reason }),
  },

  businesses: {
    getAll:  ()         => req('GET',    '/businesses'),
    create:  (data)     => req('POST',   '/businesses',       data),
    update:  (id, data) => req('PUT',    `/businesses/${id}`, data),
    remove:  (id)       => req('DELETE', `/businesses/${id}`),
  },
};
