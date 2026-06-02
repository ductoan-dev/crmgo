// ══ Order Service ══════════════════════════════════════════════
// Business logic cho Order/Workflow — không truy cập Zustand store trực tiếp.
// Mỗi hàm trả về order đã cập nhật (full object) để store replace trong state.

import { api } from '../utils/api';
import { fromApiOrder } from '../utils/mappers';
import {
  ORDER_OVERDUE_HOURS, ORDER_OVERDUE_RESEND_HOURS,
  NCC_QUOTE_DEADLINE_HOURS, NCC_QUOTE_RESEND_HOURS,
  WF_LABEL,
} from '../utils/constants';
import { makeWfEntry, genCode } from '../utils/helpers';

// ── Order CRUD ─────────────────────────────────────────────────

export async function createOrder(order, opps, orders, useApi) {
  if (useApi) {
    const created = await api.orders.create(order);
    return fromApiOrder(created);
  }
  const opp      = opps.find(o => o.id === order.oppId);
  const siblings = orders.filter(o => o.oppId === order.oppId).length;
  const code     = opp ? `${opp.code}-${siblings + 1}` : genCode('ORD');
  return {
    id:                Date.now(),
    code,
    wfStatus:          'pending_kt',
    wfStatusChangedAt: new Date().toISOString(),
    wfHistory:         [makeWfEntry('Tạo đơn', order.emp, 'KD tạo đơn hàng')],
    createdAt:         new Date(),
    dateStr:           new Date().toLocaleDateString('vi-VN'),
    lines:             [],
    ktApproved:        false,
    defect:            false,
    status:            'Mới',
    ...order,
  };
}

// ── Workflow transitions ────────────────────────────────────────

/**
 * KT phê duyệt đơn → pending_kt → kt_approved.
 * Trả về null nếu guard fail (không tồn tại hoặc đã duyệt rồi).
 */
export async function ktApprove(ordId, by, orders, useApi) {
  const order = orders.find(o => o.id === ordId);
  if (!order || order.ktApproved === true) return null;

  if (useApi) {
    const updated = await api.orders.advance(ordId, `KT ${by} phê duyệt`);
    return fromApiOrder(updated);
  }
  const nextStatus = (!order.wfStatus || order.wfStatus === 'pending_kt')
    ? 'kt_approved' : order.wfStatus;
  return {
    ...order,
    wfStatus:          nextStatus,
    wfStatusChangedAt: new Date().toISOString(),
    ktApproved:        true,
    ktApprovedBy:      by,
    ktApprovedAt:      new Date().toLocaleString('vi-VN'),
  };
}

/** KT từ chối đơn. */
export async function ktReject(ordId, by, reason, orders, useApi) {
  const order = orders.find(o => o.id === ordId);
  if (!order) return null;

  if (useApi) {
    const updated = await api.orders.reject(ordId, reason);
    return fromApiOrder(updated);
  }
  return { ...order, ktRejected: true, ktRejectNote: reason };
}

/** SMGR giao đơn cho NCC sản xuất (force set supplier_sent, bypass WF_TRANSITIONS). */
export async function smgrAssignNcc(ordId, { nccName, expectDate, note }, by, orders, useApi) {
  const order = orders.find(o => o.id === ordId);
  if (!order) return null;

  if (useApi) {
    const updated = await api.orders.smgrAssign(ordId, { nccName, expectDate, note });
    return fromApiOrder(updated);
  }
  const now = new Date().toISOString();
  return {
    ...order,
    wfStatus:          'supplier_sent',
    wfStatusChangedAt: now,
    smgrNccName:       nccName,
    smgrExpectDate:    expectDate || null,
    smgrNote:          note || null,
    smgrAssignedAt:    now,
    smgrAssignedBy:    by,
  };
}

/** NCC/Prod đánh dấu sản xuất hoàn thành → in_warehouse. */
export async function markProdDone(ordId, by, orders, useApi) {
  const order = orders.find(o => o.id === ordId);
  if (!order) return null;

  if (useApi) {
    const updated = await api.orders.advance(ordId, `NCC ${by} hoàn thành sản xuất`);
    return fromApiOrder(updated);
  }
  return {
    ...order,
    wfStatus:          'in_warehouse',
    wfStatusChangedAt: new Date().toISOString(),
    defect:            false,
    isDefect:          false,
  };
}

/** NCC/Prod báo lỗi sản xuất. */
export async function markProdDefect(ordId, by, note, orders, useApi) {
  const order = orders.find(o => o.id === ordId);
  if (!order) return null;

  if (useApi) {
    await api.orders.prodFields(ordId, { defect: true, is_defect: true, defect_note: note || '' });
  }
  return { ...order, defect: true, isDefect: true, defectNote: note };
}

/** Bỏ lỗi sản xuất. */
export async function clearProdDefect(ordId, by, orders, useApi) {
  const order = orders.find(o => o.id === ordId);
  if (!order) return null;

  if (useApi) {
    await api.orders.prodFields(ordId, { defect: false, is_defect: false, defect_note: '' });
  }
  return { ...order, defect: false, isDefect: false, defectNote: '' };
}

/** NCC báo giá cho đơn In nhanh. */
export async function updateProdQuote(ordId, price, note, by, orders, useApi) {
  const order = orders.find(o => o.id === ordId);
  if (!order) return null;

  if (useApi) {
    await api.orders.prodFields(ordId, {
      ncc_quote_price: price,
      ncc_quote_note:  note,
      ncc_quoted_by:   by,
      ncc_quoted_at:   new Date().toLocaleDateString('vi-VN'),
    });
  }
  return {
    ...order,
    nccQuotePrice:    price,
    nccQuoteNote:     note,
    nccQuotedBy:      by,
    nccQuotedAt:      new Date().toLocaleDateString('vi-VN'),
    nccDeclined:      false,
    nccDeclineReason: '',
  };
}

/** NCC từ chối báo giá. */
export async function declineProdQuote(ordId, reason, by, orders, useApi) {
  const order = orders.find(o => o.id === ordId);
  if (!order) return null;

  if (useApi) {
    await api.orders.prodFields(ordId, {
      ncc_declined:       true,
      ncc_decline_reason: reason,
      ncc_declined_by:    by,
      ncc_declined_at:    new Date().toLocaleDateString('vi-VN'),
      ncc_quote_price:    null,
    });
  }
  return {
    ...order,
    nccDeclined:      true,
    nccDeclineReason: reason,
    nccDeclinedBy:    by,
    nccDeclinedAt:    new Date().toLocaleDateString('vi-VN'),
    nccQuotePrice:    null,
    nccQuoteNote:     '',
  };
}

/**
 * KT ghi nhận thanh toán (cộng dồn).
 * Trả về { updatedOrder, newTotal } để store cập nhật state và ghi wfHistory.
 */
export async function recordPayment(ordId, amount, orders, useApi) {
  const order = orders.find(o => o.id === ordId);
  if (!order) return null;

  if (useApi) {
    const updated  = await api.orders.recordPayment(ordId, amount);
    const mapped   = fromApiOrder(updated);
    return { updatedOrder: mapped, newTotal: mapped.ktPaidAmount };
  }
  const newTotal = (order.ktPaidAmount || 0) + amount;
  return { updatedOrder: { ...order, ktPaidAmount: newTotal }, newTotal };
}

/** Designer nhận đơn → in_design. */
export async function designAccept(ordId, by, orders, useApi) {
  const order = orders.find(o => o.id === ordId);
  if (!order) return null;

  if (useApi) {
    const updated = await api.orders.advance(ordId, `Designer ${by} nhận đơn`);
    return fromApiOrder(updated);
  }
  return {
    ...order,
    wfStatus:          'in_design',
    wfStatusChangedAt: new Date().toISOString(),
    designAcceptedBy:  by,
    designAcceptedAt:  new Date().toISOString(),
  };
}

/** Designer hoàn thành thiết kế → design_done. */
export async function designComplete(ordId, by, note, orders, useApi) {
  const order = orders.find(o => o.id === ordId);
  if (!order) return null;

  if (useApi) {
    const updated = await api.orders.advance(ordId, `Designer ${by} hoàn thành thiết kế`);
    return fromApiOrder(updated);
  }
  return {
    ...order,
    wfStatus:          'design_done',
    wfStatusChangedAt: new Date().toISOString(),
    designDoneBy:      by,
    designDoneAt:      new Date().toISOString(),
    designNote:        note || order.designNote || '',
  };
}

/** Kho giao hàng → delivered. */
export async function khoDeliver(ordId, by, note, orders, useApi) {
  const order = orders.find(o => o.id === ordId);
  if (!order) return null;

  if (useApi) {
    const updated = await api.orders.advance(ordId, `Kho ${by} giao hàng`);
    return fromApiOrder(updated);
  }
  return {
    ...order,
    wfStatus:          'delivered',
    wfStatusChangedAt: new Date().toISOString(),
    deliveredBy:       by,
    deliveredAt:       new Date().toISOString(),
    deliveryNote:      note || '',
  };
}

// ── Background checks (pure functions) ────────────────────────

/**
 * Kiểm tra đơn hàng quá hạn chưa đổi trạng thái.
 * Trả về { updatedOrders, notifications[], dirty }.
 */
export function checkOverdueOrders(orders, user) {
  if (!user) return { updatedOrders: orders, notifications: [], dirty: false };

  const now   = Date.now();
  let   dirty = false;
  const notifications = [];

  const updatedOrders = orders.map(order => {
    if (order.wfStatus === 'delivered') return order;
    const isMine = user.isLeader ? true : order.emp === user.name;
    if (!isMine) return order;

    const threshold = ORDER_OVERDUE_HOURS[order.wfStatus];
    if (!threshold) return order;

    const changedAt = order.wfStatusChangedAt
      ? new Date(order.wfStatusChangedAt).getTime()
      : (order.createdAt ? new Date(order.createdAt).getTime() : now);
    const ageH = (now - changedAt) / 3_600_000;
    if (ageH < threshold) return order;

    const lastNotif  = order.orderOverdueNotifiedAt
      ? new Date(order.orderOverdueNotifiedAt).getTime() : 0;
    const hoursSince = (now - lastNotif) / 3_600_000;
    if (hoursSince < ORDER_OVERDUE_RESEND_HOURS) return order;

    const wfInfo = WF_LABEL[order.wfStatus] || { label: order.wfStatus };
    const overH  = Math.floor(ageH - threshold);

    notifications.push({
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

  return { updatedOrders, notifications, dirty };
}

/**
 * Kiểm tra đơn "In nhanh" chưa có báo giá sau 24h.
 * opts.force=true: bỏ qua throttle (dùng cho nút Test SMGR).
 * Trả về { updatedOrders, notifications[], dirty }.
 */
export function checkNccQuoteDeadline(orders, user, opts = {}) {
  const { force = false } = opts;
  if (!user) return { updatedOrders: orders, notifications: [], dirty: false };

  const isProd = user.role === 'prod';
  const isSmgr = user.role === 'smgr';
  if (!isProd && !isSmgr) return { updatedOrders: orders, notifications: [], dirty: false };

  const now      = Date.now();
  const DEADLINE = NCC_QUOTE_DEADLINE_HOURS * 3_600_000;
  const RESEND_H = NCC_QUOTE_RESEND_HOURS;
  const supplier = user.supplier;
  let   dirty    = false;
  const notifications = [];

  const updatedOrders = orders.map(order => {
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
      const alertField = isProd ? 'nccQuoteOverdueAt' : 'smgrNccAlertAt';
      const lastNotif  = order[alertField] ? new Date(order[alertField]).getTime() : 0;
      if ((now - lastNotif) / 3_600_000 < RESEND_H) return order;
    }

    const ageH  = ageMs / 3_600_000;
    const overH = Math.max(0, Math.floor(ageH - NCC_QUOTE_DEADLINE_HOURS));

    if (isProd) {
      notifications.push({
        type:        'ncc_quote_overdue',
        title:       `⚠️ Chưa báo giá đơn In nhanh`,
        text:        `<strong>${order.code}</strong> · ${order.name || ''} — đã <strong>${Math.floor(ageH)}h</strong> chưa có báo giá`,
        detail:      `Hạn: ${NCC_QUOTE_DEADLINE_HOURS}h | Quá hạn ${overH > 0 ? overH + 'h' : 'vừa đến hạn'}`,
        orderId:     order.id,
        forSupplier: order.smgrNccName,
      });
    } else {
      notifications.push({
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

    if (!force) {
      dirty = true;
      const alertField = isProd ? 'nccQuoteOverdueAt' : 'smgrNccAlertAt';
      return { ...order, [alertField]: new Date(now).toISOString() };
    }
    return order;
  });

  return { updatedOrders, notifications, dirty };
}
