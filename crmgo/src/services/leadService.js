// ══ Lead Service ═══════════════════════════════════════════════
// Business logic cho Lead — không truy cập Zustand store trực tiếp.
// Mỗi hàm nhận data + useApi, trả về kết quả để store cập nhật state.

import { api } from '../utils/api';
import { fromApiLead, fromApiOpp, fromApiBusiness } from '../utils/mappers';
import { OVERDUE_HOURS, OVERDUE_RESEND_HOURS } from '../utils/constants';
import { genCode, leadAgeHours } from '../utils/helpers';

export async function addLead(lead, useApi) {
  if (useApi) {
    const created = await api.leads.create(lead);
    return fromApiLead(created);
  }
  return { id: Date.now(), ...lead, createdAt: new Date() };
}

export async function updateLead(id, patch, useApi) {
  if (useApi) {
    await api.leads.update(id, patch);
  }
}

export async function deleteLead(id, useApi) {
  if (useApi) {
    await api.leads.remove(id);
  }
}

/** Trả về patch để store merge vào lead */
export async function transferLead(id, kd, mktUser, useApi) {
  if (useApi) {
    await api.leads.transfer(id, kd.username);
  }
  return {
    assignedTo:    kd.name,
    transferredTo: kd.name,
    createdBy:     mktUser?.name,
  };
}

/**
 * Chuyển lead → Business + Opportunity.
 * Trả về { opp, business } để store cập nhật 3 slice: opps, businesses, leads.
 */
export async function convertLead(leadId, formData, lead, user, useApi) {
  if (useApi) {
    const result = await api.leads.convert(leadId, {
      kha_nang: formData.khaNang ?? 50,
      note:     formData.thongtin || null,
    });
    return {
      opp:      fromApiOpp(result.opp),
      business: fromApiBusiness(result.business),
    };
  }

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
    id:           Date.now() + 1,
    code:         genCode('OPP'),
    customerName: formData.khachHang || lead?.name || '',
    khachHang:    formData.khachHang || lead?.name || '',
    name:         formData.khachHang || lead?.name || '',
    loaiCoHoi:    formData.loai      || '',
    chungloai:    formData.danhMuc   || '',
    soluong:      formData.soluong   || '',
    donvi:        formData.donvi     || 'cái',
    diadiem:      formData.diadiem   || '',
    quycach:      formData.quycach   || '',
    chandung:     formData.chandung  || [],
    thongtin:     formData.thongtin  || '',
    khaNang:      formData.khaNang   ?? 50,
    status:       0,
    emp:          user?.name || '',
    assignedTo:   user?.name || '',
    dateObj:      now,
    dateStr:      now.toLocaleDateString('vi-VN'),
    timeStr:      now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    fromLeadId:   leadId,
    quotes:       [],
    images:       [],
  };
  return { opp: newOpp, business: newBiz };
}

/**
 * Kiểm tra lead quá hạn chưa liên hệ.
 * Pure function — không side effect, không gọi API.
 * Trả về { updatedLeads, notifications[], dirty } để store xử lý.
 */
export function checkOverdueLeads(leads, user) {
  if (!user) return { updatedLeads: leads, notifications: [], dirty: false };

  const now   = Date.now();
  let   dirty = false;
  const notifications = [];

  const updatedLeads = leads.map(lead => {
    const isMine = !lead.assignedTo || lead.assignedTo === user.name;
    if (!isMine || lead.contactStatus !== 'chua_lh') return lead;

    const ageH      = leadAgeHours(lead);
    const threshold = OVERDUE_HOURS[lead.temp || 'warm'] ?? 24;
    if (ageH < threshold) return lead;

    const lastNotif  = lead.overdueNotifiedAt ? new Date(lead.overdueNotifiedAt).getTime() : 0;
    const hoursSince = (now - lastNotif) / 3_600_000;
    if (hoursSince < OVERDUE_RESEND_HOURS) return lead;

    const tempLabel = lead.temp === 'hot' ? '🔥 Hot' : lead.temp === 'cold' ? '❄️ Cold' : '⚡ Warm';
    const overH     = Math.floor(ageH - threshold);

    notifications.push({
      type:    'overdue_lead',
      title:   `⏰ Lead quá hạn chưa liên hệ`,
      text:    `<strong>${lead.name}</strong>${lead.phone ? ` · ${lead.phone}` : ''} — đã <strong>${Math.floor(ageH)}h</strong> chưa liên hệ`,
      detail:  `${tempLabel} | Quá hạn ${overH > 0 ? overH + 'h' : 'vừa đến hạn'} | Hạn: ${threshold}h`,
      leadId:  lead.id,
      forEmp:  user.name,
      forRole: 'sales',
    });

    dirty = true;
    return { ...lead, overdueNotifiedAt: new Date(now).toISOString() };
  });

  return { updatedLeads, notifications, dirty };
}
