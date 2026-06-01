// ══ CRMGO Global Store — Zustand ══════════════════════════════
// Replaces: leads[], opps[], orders[], CU, notifications[], etc.

import { create } from 'zustand';
import { DB_KEYS, DEMO_ACCOUNTS, SUPPLIERS_DEFAULT, OVERDUE_HOURS, OVERDUE_RESEND_HOURS, ORDER_OVERDUE_HOURS, ORDER_OVERDUE_RESEND_HOURS, NCC_QUOTE_DEADLINE_HOURS, NCC_QUOTE_RESEND_HOURS, WF_LABEL } from '../utils/constants';
import { lsGet, lsSet, makeWfEntry, genCode, leadAgeHours } from '../utils/helpers';
import { api, tokenStore, fromApiLead, fromApiOpp, fromApiOrder, fromApiBusiness } from '../utils/api';

// ── Auth store ────────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  user: null,      // Current User (CU)
  token: null,
  useApi: false,   // false = localStorage demo, true = backend API

  login: (user, accessToken = null, refreshToken = null) => {
    set({ user, token: accessToken });
    if (accessToken)  tokenStore.setAccess(accessToken);
    if (refreshToken) tokenStore.setRefresh(refreshToken);
  },

  logout: () => {
    tokenStore.clearAll();
    set({ user: null, token: null, useApi: false });
  },

  setUseApi: (val) => set({ useApi: val }),

  getUser: (username, password) =>
    DEMO_ACCOUNTS.find(u => u.username === username && u.pass === password) || null,

  isLeader: () => get().user?.isLeader || false,
  hasPerm: (perm) => {
    const u = get().user;
    return u?.role === 'admin' || !!u?.permissions?.[perm];
  },
}));

// ── Data store (leads, opps, orders) ─────────────────────────
export const useDataStore = create((set, get) => ({
  leads:    [],
  opps:     [],
  orders:   [],
  suppliers: SUPPLIERS_DEFAULT,
  businesses: [],
  notifications: [],
  mktData:  [],   // Dữ liệu MKT: chi phí ads, traffic, content

  // ── Persistence ─────────────────────────────────────────────
  save: () => {
    const { leads, opps, orders, suppliers } = get();
    lsSet(DB_KEYS.leads,     leads);
    lsSet(DB_KEYS.opps,      opps);
    lsSet(DB_KEYS.orders,    orders);
    lsSet(DB_KEYS.suppliers, suppliers);
    lsSet(DB_KEYS.mktCosts,  get().mktData);
  },

  load: async () => {
    const { useApi } = useAuthStore.getState();
    if (useApi) {
      // ── Tải từ Backend API ────────────────────────────────
      try {
        const [rawLeads, rawOpps, rawOrders, rawBusinesses] = await Promise.all([
          api.leads.getAll(),
          api.opps.getAll(),
          api.orders.getAll(),
          api.businesses.getAll(),
        ]);
        set({
          leads:      rawLeads.map(fromApiLead),
          opps:       rawOpps.map(fromApiOpp),
          orders:     rawOrders.map(fromApiOrder),
          businesses: rawBusinesses.map(fromApiBusiness),
        });
        return;
      } catch (e) {
        console.error('[CRMGO] Load API error:', e.message);
      }
    }
    // ── Fallback: localStorage ────────────────────────────
    // Map giá trị orderType cũ (ORDER_TYPES) → CATS để tương thích ngược
    const ORDER_TYPE_NORM = { 'in-an': 'In nhanh', 'thiet-ke': 'Thiết kế', 'lam-mau': 'Làm mẫu', 'ban-le': 'Bán lẻ' };
    const leads  = lsGet(DB_KEYS.leads, [])
      .map(l => ({ ...l, createdAt: l.createdAt ? new Date(l.createdAt) : new Date() }));
    const opps   = lsGet(DB_KEYS.opps, [])
      .map(o => ({ ...o, dateObj: o.dateObj ? new Date(o.dateObj) : new Date(), quotes: o.quotes || [] }));
    const orders = lsGet(DB_KEYS.orders, [])
      .map(r => ({
        ...r,
        createdAt:  r.createdAt ? new Date(r.createdAt) : new Date(),
        lines:      r.lines || [],
        wfHistory:  r.wfHistory || [],
        orderType:  ORDER_TYPE_NORM[r.orderType] || r.orderType,
        type:       ORDER_TYPE_NORM[r.type]       || r.type,
      }));
    // Suppliers: ưu tiên localStorage, fallback về SUPPLIERS_DEFAULT
    const suppliers = lsGet(DB_KEYS.suppliers, null) ?? SUPPLIERS_DEFAULT.map(s => ({
      ...s, areas: [], phone: '', email: '', note: '', pass: '123456',
      createdAt: new Date().toISOString(),
    }));
    // Notifications: load từ localStorage, lọc bỏ quá 30 ngày
    const thirtyDaysAgo = Date.now() - 30 * 24 * 3_600_000;
    const notifications  = lsGet(DB_KEYS.notifications, [])
      .filter(n => new Date(n.time).getTime() > thirtyDaysAgo);
    const mktData = lsGet(DB_KEYS.mktCosts, []);
    set({ leads, opps, orders, suppliers, notifications, mktData });
  },

  // ── MKT DATA (chi phí ads, traffic, content) ─────────────────
  addMktData: (entry) => {
    const newEntry = { id: Date.now(), ...entry };
    set(s => ({ mktData: [newEntry, ...s.mktData] }));
    get().save();
    return newEntry;
  },
  deleteMktData: (id) => {
    set(s => ({ mktData: s.mktData.filter(d => d.id !== id) }));
    get().save();
  },

  // ── LEADS ────────────────────────────────────────────────────
  addLead: async (lead) => {
    const { useApi } = useAuthStore.getState();
    if (useApi) {
      const created = await api.leads.create(lead);
      const mapped  = fromApiLead(created);
      set(s => ({ leads: [mapped, ...s.leads] }));
      return mapped;
    }
    const newLead = { id: Date.now(), ...lead, createdAt: new Date() };
    set(s => ({ leads: [newLead, ...s.leads] }));
    get().save();
    return newLead;
  },
  updateLead: async (id, patch) => {
    const { useApi } = useAuthStore.getState();
    if (useApi) {
      await api.leads.update(id, patch);
    }
    set(s => ({ leads: s.leads.map(l => l.id === id ? { ...l, ...patch } : l) }));
    if (!useApi) get().save();
  },
  // MKT chuyển lead sang KD cụ thể
  transferLead: async (id, kd) => {
    // kd = { username, name } — nhân viên KD được chọn
    const { useApi } = useAuthStore.getState();
    const mktUser = useAuthStore.getState().user;
    if (useApi) {
      await api.leads.transfer(id, kd.username);
    }
    set(s => ({
      leads: s.leads.map(l => l.id === id ? {
        ...l,
        assignedTo:    kd.name,
        transferredTo: kd.name,
        // Đảm bảo createdBy được set (lead cũ có thể chưa có field này)
        createdBy: l.createdBy || mktUser?.name,
      } : l),
    }));
    if (!useApi) get().save();
  },

  deleteLead: async (id) => {
    const { useApi } = useAuthStore.getState();
    if (useApi) {
      await api.leads.remove(id);
    }
    set(s => ({ leads: s.leads.filter(l => l.id !== id) }));
    if (!useApi) get().save();
  },

  // ── Chuyển Lead → Khách hàng (Business) + Cơ hội ────────────
  // Gọi khi user click "Tạo CH" từ danh sách Lead
  convertLead: async (leadId, formData = {}) => {
    const { useApi } = useAuthStore.getState();
    const user = useAuthStore.getState().user;

    if (useApi) {
      // Backend xử lý atomic: tạo Business + Opp + đánh dấu lead
      const result = await api.leads.convert(leadId, {
        kha_nang: formData.khaNang ?? 50,
        note:     formData.thongtin || null,
      });
      const mappedOpp = fromApiOpp(result.opp);
      const mappedBiz = fromApiBusiness(result.business);

      set(s => ({
        opps:       [mappedOpp, ...s.opps],
        businesses: [mappedBiz, ...s.businesses.filter(b => b.id !== mappedBiz.id)],
        leads:      s.leads.map(l =>
          l.id === leadId ? { ...l, contactStatus: 'da_chuyen', businessId: mappedBiz.id } : l
        ),
      }));
      return { opp: mappedOpp, business: mappedBiz };
    }

    // ── Demo/localStorage mode ────────────────────────────────
    const lead = get().leads.find(l => l.id === leadId);
    const newBiz = {
      id:        Date.now(),
      name:      formData.khachHang   || lead?.name  || '',
      phone:     formData.soDienThoai || lead?.phone || '',
      email:     lead?.email || '',
      address:   '',
      industry:  '',
      taxCode:   '',
      note:      `Tự động tạo khi chuyển lead`,
      createdBy: user?.name || '',
      createdAt: new Date(),
    };
    const now = new Date();
    const newOpp = {
      id:          Date.now() + 1,
      code:        genCode('OPP'),
      customerName: formData.khachHang || lead?.name || '',
      khachHang:   formData.khachHang || lead?.name || '',
      name:        formData.khachHang || lead?.name || '',
      loaiCoHoi:   formData.loai      || '',
      chungloai:   formData.danhMuc   || '',
      soluong:     formData.soluong   || '',
      donvi:       formData.donvi     || 'cái',
      diadiem:     formData.diadiem   || '',
      quycach:     formData.quycach   || '',
      chandung:    formData.chandung  || [],
      thongtin:    formData.thongtin  || '',
      khaNang:     formData.khaNang   ?? 50,
      status:      0,
      emp:         user?.name || '',
      assignedTo:  user?.name || '',
      dateObj:     now,
      dateStr:     now.toLocaleDateString('vi-VN'),
      timeStr:     now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      fromLeadId:  leadId,
      quotes:      [],
      images:      [],
    };

    set(s => ({
      opps:       [newOpp, ...s.opps],
      businesses: [newBiz, ...s.businesses],
      leads:      s.leads.map(l =>
        l.id === leadId ? { ...l, contactStatus: 'da_chuyen', contactNote: '' } : l
      ),
    }));
    get().save();
    return { opp: newOpp, business: newBiz };
  },

  // ── Kiểm tra lead quá hạn chưa liên hệ ─────────────────────
  // Gọi khi app load + mỗi 15 phút
  checkOverdueLeads: (user) => {
    if (!user) return;
    const now   = Date.now();
    let   dirty = false;   // có cần save lại không

    const updatedLeads = get().leads.map(lead => {
      // Chỉ check lead của user này + trạng thái chưa liên hệ
      const isMine = !lead.assignedTo || lead.assignedTo === user.name;
      if (!isMine || lead.contactStatus !== 'chua_lh') return lead;

      const ageH      = leadAgeHours(lead);
      const threshold = OVERDUE_HOURS[lead.temp || 'warm'] ?? 24;
      if (ageH < threshold) return lead; // chưa quá hạn

      // Kiểm tra đã thông báo trong OVERDUE_RESEND_HOURS chưa
      const lastNotif   = lead.overdueNotifiedAt ? new Date(lead.overdueNotifiedAt).getTime() : 0;
      const hoursSince  = (now - lastNotif) / 3_600_000;
      if (hoursSince < OVERDUE_RESEND_HOURS) return lead; // thông báo gần đây rồi

      // ── Push notification vào chuông ─────────────────────────
      const tempLabel = lead.temp === 'hot' ? '🔥 Hot' : lead.temp === 'cold' ? '❄️ Cold' : '⚡ Warm';
      const overH     = Math.floor(ageH - threshold);

      get().pushNotification({
        type:   'overdue_lead',
        title:  `⏰ Lead quá hạn chưa liên hệ`,
        text:   `<strong>${lead.name}</strong>${lead.phone ? ` · ${lead.phone}` : ''} — đã <strong>${Math.floor(ageH)}h</strong> chưa liên hệ`,
        detail: `${tempLabel} | Quá hạn ${overH > 0 ? overH + 'h' : 'vừa đến hạn'} | Hạn: ${threshold}h`,
        leadId: lead.id,
        forEmp:  user.name,
        forRole: 'sales',
      });

      dirty = true;
      return { ...lead, overdueNotifiedAt: new Date(now).toISOString() };
    });

    if (dirty) {
      set({ leads: updatedLeads });
      const { opps, orders } = get();
      lsSet(DB_KEYS.leads, updatedLeads);
      lsSet(DB_KEYS.opps,  opps);
      lsSet(DB_KEYS.orders, orders);
    }
  },

  // ── Kiểm tra đơn hàng quá hạn chưa đổi trạng thái ──────────
  // Gọi khi app load + mỗi 15 phút (cùng chu kỳ với checkOverdueLeads)
  checkOverdueOrders: (user) => {
    if (!user) return;
    const now   = Date.now();
    let   dirty = false;

    const updatedOrders = get().orders.map(order => {
      // Bỏ qua đơn đã giao hoặc không phải của user
      if (order.wfStatus === 'delivered') return order;
      const isMine = user.isLeader ? true : order.emp === user.name;
      if (!isMine) return order;

      const threshold = ORDER_OVERDUE_HOURS[order.wfStatus];
      if (!threshold) return order; // trạng thái không theo dõi

      // Thời gian ở trạng thái hiện tại (dùng wfStatusChangedAt, fallback createdAt)
      const changedAt = order.wfStatusChangedAt
        ? new Date(order.wfStatusChangedAt).getTime()
        : (order.createdAt ? new Date(order.createdAt).getTime() : now);
      const ageH = (now - changedAt) / 3_600_000;
      if (ageH < threshold) return order; // chưa quá hạn

      // Kiểm tra đã thông báo gần đây chưa
      const lastNotif   = order.orderOverdueNotifiedAt
        ? new Date(order.orderOverdueNotifiedAt).getTime() : 0;
      const hoursSince  = (now - lastNotif) / 3_600_000;
      if (hoursSince < ORDER_OVERDUE_RESEND_HOURS) return order;

      // Push thông báo quá hạn
      const wfInfo = WF_LABEL[order.wfStatus] || { label: order.wfStatus };
      const overH  = Math.floor(ageH - threshold);
      get().pushNotification({
        type:    'overdue_order',
        title:   `⏰ Đơn hàng quá hạn chưa cập nhật`,
        text:    `<strong>${order.code}</strong> · ${order.name || order.customerName || ''} — đã <strong>${Math.floor(ageH)}h</strong> ở trạng thái "${wfInfo.label}"`,
        detail:  `Quá hạn ${overH > 0 ? overH + 'h' : 'vừa đến hạn'} | Hạn tối đa: ${threshold}h`,
        orderId: order.id,
        forEmp:  order.emp,
        forRole: 'sales',
      });

      dirty = true;
      return { ...order, orderOverdueNotifiedAt: new Date(now).toISOString() };
    });

    if (dirty) {
      set({ orders: updatedOrders });
      const { leads, opps } = get();
      lsSet(DB_KEYS.orders, updatedOrders);
      lsSet(DB_KEYS.leads,  leads);
      lsSet(DB_KEYS.opps,   opps);
    }
  },

  // ── Kiểm tra đơn "In nhanh" chưa báo giá sau 24h ────────────
  // Chạy cho cả role='prod' và role='smgr' — gọi khi app load + định kỳ
  // opts.force=true: bỏ qua ngưỡng thời gian (dùng cho nút Test SMGR)
  checkNccQuoteDeadline: (user, { force = false } = {}) => {
    if (!user) return;
    const isProd = user.role === 'prod';
    const isSmgr = user.role === 'smgr';
    if (!isProd && !isSmgr) return;

    const now      = Date.now();
    const DEADLINE = NCC_QUOTE_DEADLINE_HOURS * 3_600_000;
    const RESEND_H = NCC_QUOTE_RESEND_HOURS;
    const supplier = user.supplier;
    let   dirty    = false;

    const updatedOrders = get().orders.map(order => {
      if (order.orderType !== 'In nhanh')      return order;
      if (order.wfStatus  !== 'supplier_sent') return order;
      if (order.nccQuotePrice)                  return order;
      if (isProd && supplier && order.smgrNccName !== supplier) return order;

      const assignedAt = order.wfStatusChangedAt
        ? new Date(order.wfStatusChangedAt).getTime()
        : (order.createdAt ? new Date(order.createdAt).getTime() : now);
      const ageMs = now - assignedAt;

      if (!force && ageMs < DEADLINE) return order;

      if (!force) {
        // Throttle: mỗi role có field riêng để không chặn nhau
        const alertField = isProd ? 'nccQuoteOverdueAt' : 'smgrNccAlertAt';
        const lastNotif  = order[alertField] ? new Date(order[alertField]).getTime() : 0;
        if ((now - lastNotif) / 3_600_000 < RESEND_H) return order;
      }

      const ageH  = ageMs / 3_600_000;
      const overH = Math.max(0, Math.floor(ageH - NCC_QUOTE_DEADLINE_HOURS));

      if (isProd) {
        get().pushNotification({
          type:        'ncc_quote_overdue',
          title:       `⚠️ Chưa báo giá đơn In nhanh`,
          text:        `<strong>${order.code}</strong> · ${order.name || ''} — đã <strong>${Math.floor(ageH)}h</strong> chưa có báo giá`,
          detail:      `Hạn: ${NCC_QUOTE_DEADLINE_HOURS}h | Quá hạn ${overH > 0 ? overH + 'h' : 'vừa đến hạn'}`,
          orderId:     order.id,
          forSupplier: order.smgrNccName,
        });
      } else {
        get().pushNotification({
          type:    'ncc_quote_overdue',
          title:   force ? `🧪 Test — NCC chưa báo giá In nhanh` : `⚠️ NCC chưa báo giá In nhanh`,
          text:    `<strong>${order.smgrNccName || 'NCC'}</strong> chưa báo giá <strong>${order.code}</strong>${force ? '' : ` — ${Math.floor(ageH)}h đã trôi qua`}`,
          detail:  force
            ? `Kích hoạt thủ công bởi SMGR`
            : `Quá hạn ${NCC_QUOTE_DEADLINE_HOURS}h${overH > 0 ? ' | +' + overH + 'h' : ''}`,
          orderId: order.id,
          forRole: 'smgr',
        });
      }

      // force=true: không cập nhật timestamp (test không làm nhiễu chu kỳ thật)
      if (!force) {
        dirty = true;
        const alertField = isProd ? 'nccQuoteOverdueAt' : 'smgrNccAlertAt';
        return { ...order, [alertField]: new Date(now).toISOString() };
      }
      return order;
    });

    if (dirty) {
      set({ orders: updatedOrders });
      lsSet(DB_KEYS.orders, updatedOrders);
    }
  },

  // ── OPPS ─────────────────────────────────────────────────────
  addOpp: async (opp) => {
    const { useApi } = useAuthStore.getState();
    if (useApi) {
      const created = await api.opps.create(opp);
      const mapped  = fromApiOpp(created);
      set(s => ({ opps: [mapped, ...s.opps] }));
      return mapped;
    }
    const now = new Date();
    const newOpp = {
      id: Date.now(),
      code: genCode('OPP'),
      quotes: [],
      dateObj: now,
      dateStr: now.toLocaleDateString('vi-VN'),
      timeStr: now.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' }),
      status: 0,
      khaNang: 50,
      images: [],
      ...opp,
    };
    set(s => ({ opps: [newOpp, ...s.opps] }));
    get().save();
    return newOpp;
  },
  updateOpp: async (id, patch) => {
    const { useApi } = useAuthStore.getState();
    if (useApi) {
      await api.opps.update(id, patch);
    }
    set(s => ({ opps: s.opps.map(o => o.id === id ? { ...o, ...patch } : o) }));
    if (!useApi) get().save();
  },
  addQuote: (oppId, quote) => {
    set(s => ({
      opps: s.opps.map(o => o.id === oppId
        ? { ...o, quotes: [...(o.quotes || []), { id: Date.now(), ...quote }] }
        : o
      ),
    }));
    get().save();
  },

  // ── ORDERS ───────────────────────────────────────────────────
  addOrder: async (order) => {
    const { useApi } = useAuthStore.getState();
    let newOrder;

    if (useApi) {
      const created = await api.orders.create(order);
      newOrder = fromApiOrder(created);
      set(s => ({ orders: [newOrder, ...s.orders] }));
    } else {
      const opp = get().opps.find(o => o.id === order.oppId);
      const siblings = get().orders.filter(o => o.oppId === order.oppId).length;
      const code = opp ? `${opp.code}-${siblings + 1}` : genCode('ORD');
      newOrder = {
        id: Date.now(),
        code,
        wfStatus: 'pending_kt',
        wfStatusChangedAt: new Date().toISOString(),
        wfHistory: [makeWfEntry('Tạo đơn', order.emp, 'KD tạo đơn hàng')],
        createdAt: new Date(),
        dateStr: new Date().toLocaleDateString('vi-VN'),
        lines: [],
        ktApproved: false,
        defect: false,
        status: 'Mới',
        ...order,
      };
      set(s => ({ orders: [newOrder, ...s.orders] }));
      get().save();
    }

    // Update opp status → 6 (chờ thanh toán)
    if (order.oppId) get().updateOpp(order.oppId, { status: 6 });
    // Notify KT
    get().pushNotification({
      type: 'new_order',
      title: '📋 Đơn hàng mới chờ phê duyệt',
      text: `<strong>${order.emp}</strong> tạo đơn <strong>${newOrder.code}</strong>`,
      detail: `Giá trị: ${(order.grandTotal || 0).toLocaleString('vi-VN')}₫`,
      orderId: newOrder.id,
      forRole: 'ketoan',
    });
    return newOrder;
  },
  deleteOrder: (id) => {
    set(s => ({ orders: s.orders.filter(o => o.id !== id) }));
    get().save();
  },

  updateOrder: async (id, patch) => {
    const { useApi } = useAuthStore.getState();
    if (useApi) {
      await api.orders.update(id, patch);
    }
    const now = new Date().toISOString();
    set(s => ({
      orders: s.orders.map(o => {
        if (o.id !== id) return o;
        // Khi wfStatus thay đổi → ghi lại thời điểm (để check quá hạn)
        const extra = patch.wfStatus && patch.wfStatus !== o.wfStatus
          ? { wfStatusChangedAt: now }
          : {};
        return { ...o, ...patch, ...extra };
      }),
    }));
    if (!useApi) get().save();
  },
  addWfHistory: (orderId, step, by, note = '') => {
    set(s => ({
      orders: s.orders.map(o => o.id === orderId
        ? { ...o, wfHistory: [...(o.wfHistory || []), makeWfEntry(step, by, note)] }
        : o
      ),
    }));
    get().save();
  },

  // KT approve
  ktApprove: async (ordId, by) => {
    const ord = get().orders.find(o => o.id === ordId);
    if (!ord || ord.ktApproved === true) return false;   // chặn duyệt trùng

    const { useApi } = useAuthStore.getState();
    if (useApi) {
      // ── API mode: dùng POST /orders/:id/advance (ketoan có quyền) ──
      try {
        const updated = await api.orders.advance(ordId, `KT ${by} phê duyệt`);
        const mapped  = fromApiOrder(updated);
        set(s => ({
          orders: s.orders.map(o => o.id === ordId ? { ...o, ...mapped } : o),
        }));
      } catch (e) {
        console.error('[ktApprove API]', e.message);
        return false;
      }
    } else {
      // ── Demo mode: cập nhật localStorage trực tiếp ──
      const nextStatus = (!ord.wfStatus || ord.wfStatus === 'pending_kt')
        ? 'kt_approved' : ord.wfStatus;
      get().updateOrder(ordId, {
        wfStatus:     nextStatus,
        ktApproved:   true,
        ktApprovedBy: by,
        ktApprovedAt: new Date().toLocaleString('vi-VN'),
      });
    }

    // Ghi lịch sử + thông báo (chạy cả 2 mode)
    get().addWfHistory(ordId, 'KT phê duyệt', by,
      `Giá trị: ${(ord.grandTotal||0).toLocaleString('vi-VN')}₫`);
    get().pushNotification({
      type:    'kt_approved',
      title:   '✅ Đơn hàng được KT phê duyệt',
      text:    `KT ${by} đã phê duyệt đơn <strong>${ord.code}</strong>`,
      orderId: ordId,
      forRole: 'sales',
      forEmp:  ord.emp,
    });
    return true;
  },
  ktReject: async (ordId, by, reason) => {
    const ord = get().orders.find(o => o.id === ordId);
    if (!ord) return;

    const { useApi } = useAuthStore.getState();
    if (useApi) {
      // ── API mode: POST /orders/:id/reject (ketoan có quyền) ──
      try {
        const updated = await api.orders.reject(ordId, reason);
        const mapped  = fromApiOrder(updated);
        set(s => ({
          orders: s.orders.map(o => o.id === ordId ? { ...o, ...mapped } : o),
        }));
      } catch (e) {
        console.error('[ktReject API]', e.message);
        return;
      }
    } else {
      // ── Demo mode: cập nhật localStorage trực tiếp ──
      set(s => ({
        orders: s.orders.map(o =>
          o.id === ordId ? { ...o, ktRejected: true, ktRejectNote: reason } : o
        ),
      }));
      get().save();
    }

    get().addWfHistory(ordId, 'KT từ chối', by, 'Lý do: ' + reason);
  },

  // ── SMGR: Giao đơn cho NCC sản xuất ────────────────────────
  smgrAssignNcc: async (ordId, { nccName, expectDate, note }, by) => {
    const ord = get().orders.find(o => o.id === ordId);
    if (!ord) return;
    const { useApi } = useAuthStore.getState();
    if (useApi) {
      try {
        const updated = await api.orders.smgrAssign(ordId, { nccName, expectDate, note });
        const mapped  = fromApiOrder(updated);
        set(s => ({ orders: s.orders.map(o => o.id === ordId ? { ...o, ...mapped } : o) }));
      } catch (e) {
        console.error('[smgrAssignNcc API]', e.message);
        throw e;
      }
    } else {
      get().updateOrder(ordId, {
        wfStatus:       'supplier_sent',
        smgrNccName:    nccName,
        smgrExpectDate: expectDate || null,
        smgrNote:       note || null,
        smgrAssignedAt: new Date().toISOString(),
        smgrAssignedBy: by,
      });
    }
    get().addWfHistory(ordId, 'Giao NCC sản xuất', by,
      `NCC: ${nccName}${expectDate ? ' · Hạn: ' + new Date(expectDate).toLocaleDateString('vi-VN') : ''}`
    );
    // Thông báo cho NCC (prod role) + KD phụ trách
    get().pushNotification({
      type:    'new_prod_order',
      title:   '📤 Đơn hàng mới cần sản xuất',
      text:    `SMGR <strong>${by}</strong> đã giao đơn <strong>${ord.code}</strong> cho ${nccName}`,
      detail:  expectDate ? `Hạn giao: ${new Date(expectDate).toLocaleDateString('vi-VN')}` : '',
      orderId: ordId,
      forRole: 'prod',
    });
    get().pushNotification({
      type:    'order_assigned_ncc',
      title:   '🏭 Đơn hàng đã được giao NCC',
      text:    `Đơn <strong>${ord.code}</strong> → NCC <strong>${nccName}</strong>`,
      detail:  expectDate ? `Hạn giao: ${new Date(expectDate).toLocaleDateString('vi-VN')}` : '',
      orderId: ordId,
      forEmp:  ord.emp,
      forRole: 'sales',
    });
  },

  // Prod mark done/defect
  markProdDone: async (ordId, by) => {
    const { useApi } = useAuthStore.getState();
    if (useApi) {
      try {
        const updated = await api.orders.advance(ordId, `NCC ${by} hoàn thành sản xuất`);
        const mapped  = fromApiOrder(updated);
        set(s => ({ orders: s.orders.map(o => o.id === ordId ? { ...o, ...mapped } : o) }));
      } catch (e) {
        console.error('[markProdDone API]', e.message);
        throw e;
      }
    } else {
      get().updateOrder(ordId, { wfStatus: 'in_warehouse', defect: false, isDefect: false });
    }
    get().addWfHistory(ordId, 'Sản xuất hoàn thành', by, 'NCC đánh dấu hoàn thành');
  },
  markProdDefect: async (ordId, by, note) => {
    const { useApi } = useAuthStore.getState();
    if (useApi) {
      try {
        await api.orders.prodFields(ordId, { defect: true, is_defect: true, defect_note: note || '' });
      } catch (e) {
        console.error('[markProdDefect API]', e.message);
        throw e;
      }
    }
    get().updateOrder(ordId, { defect: true, isDefect: true, defectNote: note });
    get().addWfHistory(ordId, 'Báo lỗi sản xuất', by, 'Lỗi: ' + (note || '–'));
  },
  clearProdDefect: async (ordId, by) => {
    const { useApi } = useAuthStore.getState();
    if (useApi) {
      try {
        await api.orders.prodFields(ordId, { defect: false, is_defect: false, defect_note: '' });
      } catch (e) {
        console.error('[clearProdDefect API]', e.message);
        throw e;
      }
    }
    get().updateOrder(ordId, { defect: false, isDefect: false, defectNote: '' });
    get().addWfHistory(ordId, 'Bỏ lỗi', by, '');
  },
  updateProdQuote: async (ordId, price, note, by) => {
    const { useApi } = useAuthStore.getState();
    if (useApi) {
      try {
        await api.orders.prodFields(ordId, {
          ncc_quote_price: price,
          ncc_quote_note:  note,
          ncc_quoted_by:   by,
          ncc_quoted_at:   new Date().toLocaleDateString('vi-VN'),
        });
      } catch (e) {
        console.error('[updateProdQuote API]', e.message);
        throw e;
      }
    }
    get().updateOrder(ordId, {
      nccQuotePrice: price,
      nccQuoteNote:  note,
      nccQuotedBy:   by,
      nccQuotedAt:   new Date().toLocaleDateString('vi-VN'),
      nccDeclined:   false,
      nccDeclineReason: '',
    });
  },

  declineProdQuote: async (ordId, reason, by) => {
    const { useApi } = useAuthStore.getState();
    if (useApi) {
      try {
        await api.orders.prodFields(ordId, {
          ncc_declined:        true,
          ncc_decline_reason:  reason,
          ncc_declined_by:     by,
          ncc_declined_at:     new Date().toLocaleDateString('vi-VN'),
          ncc_quote_price:     null,
        });
      } catch (e) {
        console.error('[declineProdQuote API]', e.message);
        throw e;
      }
    }
    get().updateOrder(ordId, {
      nccDeclined:      true,
      nccDeclineReason: reason,
      nccDeclinedBy:    by,
      nccDeclinedAt:    new Date().toLocaleDateString('vi-VN'),
      nccQuotePrice:    null,
      nccQuoteNote:     '',
    });
    get().addWfHistory(ordId, 'Từ chối báo giá', by, 'Lý do: ' + reason);
  },

  // ── SUPPLIERS ────────────────────────────────────────────────
  addSupplier: (data) => {
    const newS = {
      id:        Date.now(),
      name:      data.name      || '',
      username:  data.username  || '',
      pass:      data.pass      || '123456',
      cats:      data.cats      || [],
      areas:     data.areas     || [],
      phone:     data.phone     || '',
      email:     data.email     || '',
      note:      data.note      || '',
      createdAt: new Date().toISOString(),
    };
    set(s => ({ suppliers: [newS, ...s.suppliers] }));
    get().save();
    return newS;
  },
  updateSupplier: (id, patch) => {
    set(s => ({ suppliers: s.suppliers.map(s2 => s2.id === id ? { ...s2, ...patch } : s2) }));
    get().save();
  },
  deleteSupplier: (id) => {
    set(s => ({ suppliers: s.suppliers.filter(s2 => s2.id !== id) }));
    get().save();
  },

  // ── KT: Ghi nhận thanh toán ──────────────────────────────────
  recordPayment: async (ordId, amount, by) => {
    const ord = get().orders.find(o => o.id === ordId);
    if (!ord) return;

    const { useApi } = useAuthStore.getState();
    let newTotal;

    if (useApi) {
      // ── API mode: POST /orders/:id/record-payment (ketoan có quyền) ──
      try {
        const updated = await api.orders.recordPayment(ordId, amount);
        const mapped  = fromApiOrder(updated);
        set(s => ({
          orders: s.orders.map(o => o.id === ordId ? { ...o, ...mapped } : o),
        }));
        newTotal = mapped.ktPaidAmount;
      } catch (e) {
        console.error('[recordPayment API]', e.message);
        return;
      }
    } else {
      // ── Demo mode: cộng dồn vào localStorage ──
      const prev = ord.ktPaidAmount || 0;
      newTotal   = prev + amount;
      set(s => ({
        orders: s.orders.map(o =>
          o.id === ordId ? { ...o, ktPaidAmount: newTotal } : o
        ),
      }));
      get().save();
    }

    get().addWfHistory(ordId, 'Ghi nhận thanh toán', by,
      `Nhận ${amount.toLocaleString('vi-VN')}₫ · Tổng đã thu: ${newTotal.toLocaleString('vi-VN')}₫`
    );
    // Thông báo cho KD
    get().pushNotification({
      type:    'payment_received',
      title:   '💰 Đã ghi nhận thanh toán',
      text:    `KT <strong>${by}</strong> ghi nhận <strong>${amount.toLocaleString('vi-VN')}₫</strong> từ đơn <strong>${ord.code}</strong>`,
      detail:  `Tổng đã thu: ${newTotal.toLocaleString('vi-VN')}₫ / ${(ord.grandTotal||0).toLocaleString('vi-VN')}₫`,
      orderId: ordId,
      forEmp:  ord.emp,
      forRole: 'sales',
    });
  },

  // ── NOTIFICATIONS ────────────────────────────────────────────
  pushNotification: (notif) => {
    const n = { id: Date.now() + Math.random(), ...notif, time: new Date().toISOString(), read: false };
    set(s => {
      const updated = [n, ...s.notifications].slice(0, 150); // giữ tối đa 150 thông báo
      lsSet(DB_KEYS.notifications, updated);
      return { notifications: updated };
    });
  },
  markNotifRead: (id) => {
    set(s => {
      const updated = s.notifications.map(n => n.id === id ? { ...n, read: true } : n);
      lsSet(DB_KEYS.notifications, updated);
      return { notifications: updated };
    });
  },
  markAllRead: () => {
    set(s => {
      const updated = s.notifications.map(n => ({ ...n, read: true }));
      lsSet(DB_KEYS.notifications, updated);
      return { notifications: updated };
    });
  },
}));

// ── UI store ──────────────────────────────────────────────────
export const useUIStore = create((set) => ({
  // Khôi phục tab từ localStorage khi F5
  activeTab:   localStorage.getItem('crmgo_tab') || 'leads',
  modal:       null,    // { type, data }
  sidePanel:   null,
  toasts:      [],

  setTab: (tab) => {
    localStorage.setItem('crmgo_tab', tab);
    set({ activeTab: tab });
  },
  openModal:   (type, data = null) => set({ modal: { type, data } }),
  closeModal:  ()     => set({ modal: null }),
  setSidePanel:(panel)=> set({ sidePanel: panel }),
}));
