// ══ CRMGO Global Store — Zustand ══════════════════════════════
// Store chỉ quản lý state và điều phối các service calls.
// Business logic nằm trong src/services/.

import { create } from 'zustand';
import { DB_KEYS, DEMO_ACCOUNTS, SUPPLIERS_DEFAULT } from '../utils/constants';
import { lsGet, lsSet, makeWfEntry } from '../utils/helpers';
import { api, tokenStore } from '../utils/api';
import { fromApiLead, fromApiOpp, fromApiOrder, fromApiBusiness, toApiSupplier, fromApiSupplier } from '../utils/mappers';
import * as leadService  from '../services/leadService';
import * as orderService from '../services/orderService';
import * as oppService   from '../services/oppService';

// ── Auth store ────────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  user:   null,
  token:  null,
  useApi: false,

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
  hasPerm:  (perm) => {
    const u = get().user;
    return u?.role === 'admin' || !!u?.permissions?.[perm];
  },
}));

// ── Data store (leads, opps, orders) ─────────────────────────
export const useDataStore = create((set, get) => ({
  leads:         [],
  opps:          [],
  orders:        [],
  suppliers:     SUPPLIERS_DEFAULT,
  businesses:    [],
  notifications: [],
  mktData:       [],

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
      try {
        const [rawLeads, rawOpps, rawOrders, rawBusinesses, rawSuppliers] = await Promise.all([
          api.leads.getAll(),
          api.opps.getAll(),
          api.orders.getAll(),
          api.businesses.getAll(),
          api.suppliers.getAll(),
        ]);

        set({
          leads:      rawLeads.map(fromApiLead),
          opps:       rawOpps.map(fromApiOpp),
          orders:     rawOrders.map(fromApiOrder),
          businesses: rawBusinesses.map(fromApiBusiness),
          suppliers:  rawSuppliers.map(fromApiSupplier),
        });
        return;
      } catch (e) {
        console.error('[CRMGO] Load API error:', e.message);
      }
    }
    // Fallback: localStorage
    const ORDER_TYPE_NORM = { 'in-an': 'In nhanh', 'thiet-ke': 'Thiết kế', 'lam-mau': 'Làm mẫu', 'ban-le': 'Bán lẻ' };
    const leads  = lsGet(DB_KEYS.leads, [])
      .map(l => ({
        ...l,
        createdAt:   l.createdAt ? new Date(l.createdAt) : new Date(),
        cskhCalls:   Array.isArray(l.cskhCalls)   ? l.cskhCalls   : [],
        chandung:    Array.isArray(l.chandung)     ? l.chandung    : [],
        attachments: Array.isArray(l.attachments)  ? l.attachments : [],
      }));
    const opps   = lsGet(DB_KEYS.opps, [])
      .map(o => ({ ...o, dateObj: o.dateObj ? new Date(o.dateObj) : new Date(), quotes: o.quotes || [] }));
    const orders = lsGet(DB_KEYS.orders, [])
      .map(r => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        lines:     r.lines     || [],
        wfHistory: r.wfHistory || [],
        orderType: ORDER_TYPE_NORM[r.orderType] || r.orderType,
        type:      ORDER_TYPE_NORM[r.type]       || r.type,
      }));
    const normSup = (s) => ({
      ...s,
      cats:  Array.isArray(s.cats)  ? s.cats  : [],
      areas: Array.isArray(s.areas) ? s.areas : [],
      rating: s.rating ?? 0,
    });
    const suppliers = (lsGet(DB_KEYS.suppliers, null) ?? SUPPLIERS_DEFAULT.map(s => ({
      ...s, areas: [], phone: '', email: '', note: '', pass: '123456',
      createdAt: new Date().toISOString(),
    }))).map(normSup);
    const thirtyDaysAgo  = Date.now() - 30 * 24 * 3_600_000;
    const notifications  = lsGet(DB_KEYS.notifications, [])
      .filter(n => new Date(n.time).getTime() > thirtyDaysAgo);
    const mktData = lsGet(DB_KEYS.mktCosts, []);
    set({ leads, opps, orders, suppliers, notifications, mktData });
  },

  // ── MKT DATA ─────────────────────────────────────────────────
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
    const newLead = await leadService.addLead(lead, useApi);
    set(s => ({ leads: [newLead, ...s.leads] }));
    if (!useApi) get().save();
    return newLead;
  },

  updateLead: async (id, patch) => {
    const { useApi } = useAuthStore.getState();
    // Optimistic update — UI phản hồi ngay, API sync background
    set(s => ({ leads: s.leads.map(l => l.id === id ? { ...l, ...patch } : l) }));
    get().save();
    if (useApi) {
      try {
        await leadService.updateLead(id, patch, true);
      } catch (e) {
        console.warn('[updateLead] API sync failed:', e.message);
      }
    }
  },

  transferLead: async (id, kd) => {
    const { useApi } = useAuthStore.getState();
    const mktUser   = useAuthStore.getState().user;
    const patch     = await leadService.transferLead(id, kd, mktUser, useApi);
    set(s => ({
      leads: s.leads.map(l => l.id === id ? {
        ...l,
        assignedTo:    patch.assignedTo,
        transferredTo: patch.transferredTo,
        createdBy:     l.createdBy || patch.createdBy,
      } : l),
    }));
    if (!useApi) get().save();
  },

  deleteLead: async (id) => {
    const { useApi } = useAuthStore.getState();
    await leadService.deleteLead(id, useApi);
    set(s => ({ leads: s.leads.filter(l => l.id !== id) }));
    if (!useApi) get().save();
  },

  convertLead: async (leadId, formData = {}) => {
    const { useApi } = useAuthStore.getState();
    const user       = useAuthStore.getState().user;
    const lead       = get().leads.find(l => l.id === leadId);
    const { opp, business } = await leadService.convertLead(leadId, formData, lead, user, useApi);
    set(s => ({
      opps:       [opp, ...s.opps],
      businesses: [business, ...s.businesses.filter(b => b.id !== business.id)],
      leads:      s.leads.map(l =>
        l.id === leadId ? { ...l, contactStatus: 'da_chuyen', businessId: business.id } : l
      ),
    }));
    if (!useApi) get().save();
    return { opp, business };
  },

  checkOverdueLeads: (user) => {
    const { leads, opps, orders } = get();
    const { updatedLeads, notifications, dirty } = leadService.checkOverdueLeads(leads, user);
    if (dirty) {
      set({ leads: updatedLeads });
      lsSet(DB_KEYS.leads,  updatedLeads);
      lsSet(DB_KEYS.opps,   opps);
      lsSet(DB_KEYS.orders, orders);
    }
    notifications.forEach(n => get().pushNotification(n));
  },

  // ── OPPS ─────────────────────────────────────────────────────
  addOpp: async (opp) => {
    const { useApi } = useAuthStore.getState();
    const newOpp     = await oppService.addOpp(opp, useApi);
    set(s => ({ opps: [newOpp, ...s.opps] }));
    if (!useApi) get().save();
    return newOpp;
  },

  updateOpp: async (id, patch) => {
    const { useApi } = useAuthStore.getState();
    await oppService.updateOpp(id, patch, useApi);
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
    const { useApi }      = useAuthStore.getState();
    const { opps, orders } = get();
    const newOrder = await orderService.createOrder(order, opps, orders, useApi);
    set(s => ({ orders: [newOrder, ...s.orders] }));
    if (!useApi) get().save();

    if (order.oppId) get().updateOpp(order.oppId, { status: 6 });
    get().pushNotification({
      type:    'new_order',
      title:   '📋 Đơn hàng mới chờ phê duyệt',
      text:    `<strong>${order.emp}</strong> tạo đơn <strong>${newOrder.code}</strong>`,
      detail:  `Giá trị: ${(order.grandTotal || 0).toLocaleString('vi-VN')}₫`,
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

  ktApprove: async (ordId, by) => {
    const { useApi } = useAuthStore.getState();
    const { orders } = get();
    const ord        = orders.find(o => o.id === ordId);
    if (!ord) return false;

    try {
      const updated = await orderService.ktApprove(ordId, by, orders, useApi);
      if (!updated) return false;
      set(s => ({ orders: s.orders.map(o => o.id === ordId ? updated : o) }));
      if (!useApi) get().save();
    } catch (e) {
      console.error('[ktApprove]', e.message);
      return false;
    }

    get().addWfHistory(ordId, 'KT phê duyệt', by,
      `Giá trị: ${(ord.grandTotal || 0).toLocaleString('vi-VN')}₫`);
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
    const { useApi } = useAuthStore.getState();
    const { orders } = get();

    try {
      const updated = await orderService.ktReject(ordId, by, reason, orders, useApi);
      if (!updated) return;
      set(s => ({ orders: s.orders.map(o => o.id === ordId ? updated : o) }));
      if (!useApi) get().save();
    } catch (e) {
      console.error('[ktReject]', e.message);
      return;
    }

    get().addWfHistory(ordId, 'KT từ chối', by, 'Lý do: ' + reason);
  },

  smgrAssignNcc: async (ordId, { nccName, expectDate, note }, by) => {
    const { useApi } = useAuthStore.getState();
    const { orders } = get();
    const ord        = orders.find(o => o.id === ordId);
    if (!ord) return;

    try {
      const updated = await orderService.smgrAssignNcc(ordId, { nccName, expectDate, note }, by, orders, useApi);
      if (!updated) return;
      set(s => ({ orders: s.orders.map(o => o.id === ordId ? updated : o) }));
      if (!useApi) get().save();
    } catch (e) {
      console.error('[smgrAssignNcc]', e.message);
      throw e;
    }

    get().addWfHistory(ordId, 'Giao NCC sản xuất', by,
      `NCC: ${nccName}${expectDate ? ' · Hạn: ' + new Date(expectDate).toLocaleDateString('vi-VN') : ''}`
    );
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

  markProdDone: async (ordId, by) => {
    const { useApi } = useAuthStore.getState();
    const { orders } = get();

    try {
      const updated = await orderService.markProdDone(ordId, by, orders, useApi);
      if (!updated) return;
      set(s => ({ orders: s.orders.map(o => o.id === ordId ? updated : o) }));
      if (!useApi) get().save();
    } catch (e) {
      console.error('[markProdDone]', e.message);
      throw e;
    }

    get().addWfHistory(ordId, 'Sản xuất hoàn thành', by, 'NCC đánh dấu hoàn thành');
  },

  markProdDefect: async (ordId, by, note) => {
    const { useApi } = useAuthStore.getState();
    const { orders } = get();

    try {
      const updated = await orderService.markProdDefect(ordId, by, note, orders, useApi);
      if (!updated) return;
      set(s => ({ orders: s.orders.map(o => o.id === ordId ? updated : o) }));
      if (!useApi) get().save();
    } catch (e) {
      console.error('[markProdDefect]', e.message);
      throw e;
    }

    get().addWfHistory(ordId, 'Báo lỗi sản xuất', by, 'Lỗi: ' + (note || '–'));
  },

  clearProdDefect: async (ordId, by) => {
    const { useApi } = useAuthStore.getState();
    const { orders } = get();

    try {
      const updated = await orderService.clearProdDefect(ordId, by, orders, useApi);
      if (!updated) return;
      set(s => ({ orders: s.orders.map(o => o.id === ordId ? updated : o) }));
      if (!useApi) get().save();
    } catch (e) {
      console.error('[clearProdDefect]', e.message);
      throw e;
    }

    get().addWfHistory(ordId, 'Bỏ lỗi', by, '');
  },

  updateProdQuote: async (ordId, price, note, by) => {
    const { useApi } = useAuthStore.getState();
    const { orders } = get();

    try {
      const updated = await orderService.updateProdQuote(ordId, price, note, by, orders, useApi);
      if (!updated) return;
      set(s => ({ orders: s.orders.map(o => o.id === ordId ? updated : o) }));
      if (!useApi) get().save();
    } catch (e) {
      console.error('[updateProdQuote]', e.message);
      throw e;
    }
  },

  declineProdQuote: async (ordId, reason, by) => {
    const { useApi } = useAuthStore.getState();
    const { orders } = get();

    try {
      const updated = await orderService.declineProdQuote(ordId, reason, by, orders, useApi);
      if (!updated) return;
      set(s => ({ orders: s.orders.map(o => o.id === ordId ? updated : o) }));
      if (!useApi) get().save();
    } catch (e) {
      console.error('[declineProdQuote]', e.message);
      throw e;
    }

    get().addWfHistory(ordId, 'Từ chối báo giá', by, 'Lý do: ' + reason);
  },

  addNccQuoteItem: (ordId, { donGia, soLuong, note }) => {
    const now     = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
                  + ' ' + now.toLocaleDateString('vi-VN');
    const item = { id: Date.now(), time: timeStr, donGia, soLuong, tongGia: donGia * soLuong, note: note || '' };
    set(s => ({
      orders: s.orders.map(o => {
        if (o.id !== ordId) return o;
        const items = [...(o.nccQuoteItems || []), item];
        return { ...o, nccQuoteItems: items, nccQuotePrice: item.tongGia };
      }),
    }));
    get().save();
    return item;
  },

  deleteNccQuoteItem: (ordId, itemId) => {
    set(s => ({
      orders: s.orders.map(o => {
        if (o.id !== ordId) return o;
        const items     = (o.nccQuoteItems || []).filter(i => i.id !== itemId);
        const lastPrice = items.length > 0 ? items[items.length - 1].tongGia : null;
        return { ...o, nccQuoteItems: items, nccQuotePrice: lastPrice };
      }),
    }));
    get().save();
  },

  designAccept: async (ordId, by) => {
    const { useApi } = useAuthStore.getState();
    const { orders } = get();
    const ord = orders.find(o => o.id === ordId);
    if (!ord) return;

    const updated = await orderService.designAccept(ordId, by, orders, useApi);
    if (!updated) return;
    set(s => ({ orders: s.orders.map(o => o.id === ordId ? updated : o) }));
    if (!useApi) get().save();

    get().addWfHistory(ordId, 'Designer nhận đơn', by, '');
    get().pushNotification({
      type:    'design_accepted',
      title:   '🎨 Đơn hàng đã được nhận thiết kế',
      text:    `Designer <strong>${by}</strong> đã nhận đơn <strong>${ord.code}</strong>`,
      orderId: ordId,
      forEmp:  ord.emp,
      forRole: 'sales',
    });
  },

  designComplete: async (ordId, by, note) => {
    const { useApi } = useAuthStore.getState();
    const { orders } = get();
    const ord = orders.find(o => o.id === ordId);
    if (!ord) return;

    const updated = await orderService.designComplete(ordId, by, note, orders, useApi);
    if (!updated) return;
    set(s => ({ orders: s.orders.map(o => o.id === ordId ? updated : o) }));
    if (!useApi) get().save();

    get().addWfHistory(ordId, 'Thiết kế hoàn thành', by, note || '');
    get().pushNotification({
      type:    'design_done',
      title:   '✅ Thiết kế hoàn thành — Chờ SMGR tiếp nhận',
      text:    `Designer <strong>${by}</strong> hoàn thành thiết kế đơn <strong>${ord.code}</strong>`,
      orderId: ordId,
      forRole: 'smgr',
    });
  },

  khoDeliver: async (ordId, by, note) => {
    const { useApi } = useAuthStore.getState();
    const { orders } = get();
    const ord = orders.find(o => o.id === ordId);
    if (!ord) return;

    const updated = await orderService.khoDeliver(ordId, by, note, orders, useApi);
    if (!updated) return;
    set(s => ({ orders: s.orders.map(o => o.id === ordId ? updated : o) }));
    if (!useApi) get().save();

    get().addWfHistory(ordId, 'Giao hàng hoàn thành', by, note || '');
    get().pushNotification({
      type:    'order_delivered',
      title:   '🎉 Đơn hàng đã giao thành công',
      text:    `Kho <strong>${by}</strong> đã giao đơn <strong>${ord.code}</strong>`,
      detail:  note || '',
      orderId: ordId,
      forEmp:  ord.emp,
      forRole: 'sales',
    });
  },

  recordPayment: async (ordId, amount, by) => {
    const { useApi } = useAuthStore.getState();
    const { orders } = get();
    const ord        = orders.find(o => o.id === ordId);
    if (!ord) return;

    try {
      const result = await orderService.recordPayment(ordId, amount, orders, useApi);
      if (!result) return;
      const { updatedOrder, newTotal } = result;
      set(s => ({ orders: s.orders.map(o => o.id === ordId ? updatedOrder : o) }));
      if (!useApi) get().save();

      get().addWfHistory(ordId, 'Ghi nhận thanh toán', by,
        `Nhận ${amount.toLocaleString('vi-VN')}₫ · Tổng đã thu: ${newTotal.toLocaleString('vi-VN')}₫`
      );
      get().pushNotification({
        type:    'payment_received',
        title:   '💰 Đã ghi nhận thanh toán',
        text:    `KT <strong>${by}</strong> ghi nhận <strong>${amount.toLocaleString('vi-VN')}₫</strong> từ đơn <strong>${ord.code}</strong>`,
        detail:  `Tổng đã thu: ${newTotal.toLocaleString('vi-VN')}₫ / ${(ord.grandTotal || 0).toLocaleString('vi-VN')}₫`,
        orderId: ordId,
        forEmp:  ord.emp,
        forRole: 'sales',
      });
    } catch (e) {
      console.error('[recordPayment]', e.message);
    }
  },

  // ── Background checks ─────────────────────────────────────────
  checkOverdueOrders: (user) => {
    const { orders, leads } = get();
    const { updatedOrders, notifications, dirty } = orderService.checkOverdueOrders(orders, user);
    if (dirty) {
      set({ orders: updatedOrders });
      lsSet(DB_KEYS.orders, updatedOrders);
      lsSet(DB_KEYS.leads,  leads);
    }
    notifications.forEach(n => get().pushNotification(n));
  },

  checkNccQuoteDeadline: (user, opts = {}) => {
    const { orders } = get();
    const { updatedOrders, notifications, dirty } = orderService.checkNccQuoteDeadline(orders, user, opts);
    if (dirty) {
      set({ orders: updatedOrders });
      lsSet(DB_KEYS.orders, updatedOrders);
    }
    notifications.forEach(n => get().pushNotification(n));
  },

  // ── SUPPLIERS ────────────────────────────────────────────────
  addSupplier: async (data) => {
    const { useApi } = useAuthStore.getState();
    if (useApi) {
      const raw = await api.suppliers.create(toApiSupplier(data));
      const newS = { ...fromApiSupplier(raw), pass: data.pass || '' };
      set(s => ({ suppliers: [newS, ...s.suppliers] }));
      return newS;
    }
    const newS = {
      id:              Date.now(),
      name:            data.name            || '',
      username:        data.username        || '',
      pass:            data.pass            || '123456',
      cats:            data.cats            || [],
      areas:           data.areas           || [],
      phone:           data.phone           || '',
      email:           data.email           || '',
      note:            data.note            || '',
      company:         data.company         || '',
      taxCode:         data.taxCode         || '',
      workshopAddress: data.workshopAddress || '',
      rating:          data.rating          ?? 0,
      ratingPros:      data.ratingPros      || '',
      ratingCons:      data.ratingCons      || '',
      createdAt:       new Date().toISOString(),
    };
    set(s => ({ suppliers: [newS, ...s.suppliers] }));
    lsSet(DB_KEYS.suppliers, get().suppliers);
    return newS;
  },
  updateSupplier: async (id, patch) => {
    const { useApi } = useAuthStore.getState();
    if (useApi) {
      const raw = await api.suppliers.update(id, toApiSupplier(patch));
      const updated = { ...fromApiSupplier(raw), pass: patch.pass || '' };
      set(s => ({ suppliers: s.suppliers.map(s2 => s2.id === id ? updated : s2) }));
      return;
    }
    set(s => ({ suppliers: s.suppliers.map(s2 => s2.id === id ? { ...s2, ...patch } : s2) }));
    lsSet(DB_KEYS.suppliers, get().suppliers);
  },
  deleteSupplier: async (id) => {
    const { useApi } = useAuthStore.getState();
    if (useApi) {
      await api.suppliers.remove(id);
      set(s => ({ suppliers: s.suppliers.filter(s2 => s2.id !== id) }));
      return;
    }
    set(s => ({ suppliers: s.suppliers.filter(s2 => s2.id !== id) }));
    lsSet(DB_KEYS.suppliers, get().suppliers);
  },

  // ── NOTIFICATIONS ────────────────────────────────────────────
  pushNotification: (notif) => {
    const n = { id: Date.now() + Math.random(), ...notif, time: new Date().toISOString(), read: false };
    set(s => {
      const updated = [n, ...s.notifications].slice(0, 150);
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
  activeTab:  localStorage.getItem('crmgo_tab') || 'leads',
  modal:      null,
  sidePanel:  null,
  toasts:     [],

  setTab:      (tab)   => { localStorage.setItem('crmgo_tab', tab); set({ activeTab: tab }); },
  openModal:   (type, data = null) => set({ modal: { type, data } }),
  closeModal:  ()      => set({ modal: null }),
  setSidePanel:(panel) => set({ sidePanel: panel }),
}));
