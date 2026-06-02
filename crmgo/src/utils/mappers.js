// ══ CRMGO Field Mappers — Frontend ↔ Backend ══════════════════
// Pure functions: chuyển đổi format giữa frontend state và DB/API response

/** Lead: frontend → DB */
export const toApiLead = (f) => ({
  customer_name:  f.name,
  phone:          f.phone      || null,
  email:          f.email      || null,
  contact_status: f.contactStatus || 'chua_lh',
  temperature:    f.temp       || 'warm',
  source:         f.channel    || null,
  area:           f.area       || null,
  note:           f.note       || null,
  birthday:       f.birthday   || null,
  nganh:          f.nganh      || null,
  loai_khach:     f.loaiKhach  || null,
  uu_tien:        f.uuTien     || 'trung_binh',
  ngan_sach:      f.nganSach   || null,
  thoi_diem:      f.thoiDiem   || null,
  chandung:       f.chandung   || [],
  product:        f.product    || null,
  trang_thai:     f.trangThai  || 'moi',
  cskh_calls:     f.cskhCalls  || [],
  attachments:    f.attachments || [],
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
  channel:       d.source    || '',
  area:          d.area      || '',
  note:          d.note      || '',
  emp:           d.emp?.name || '',
  transferredTo: d.transferredTo?.name || null,
  assignedTo:    d.transferredTo?.name || d.emp?.name || '',
  // Các field mới (migration 014)
  birthday:    d.birthday    || undefined,
  nganh:       d.nganh       || '',
  loaiKhach:   d.loai_khach  || '',
  uuTien:      d.uu_tien     || 'trung_binh',
  nganSach:    d.ngan_sach   || 'Chưa xác định',
  thoiDiem:    d.thoi_diem   || 'Chưa xác định',
  chandung:    d.chandung    || [],
  product:     d.product     || '',
  trangThai:   d.trang_thai  || 'moi',
  cskhCalls:   d.cskh_calls  || [],
  attachments: d.attachments || [],
  createdAt:   d.created_at ? new Date(d.created_at) : new Date(),
});

/** Opportunity: frontend → DB */
export const toApiOpp = (f) => ({
  customer_name: f.customerName || f.khachHang || f.name || '',
  status:        f.status ?? 0,
  kha_nang:      f.khaNang ?? 50,
  note:          f.note || null,
  lead_id:       f.leadId || f.fromLeadId || null,
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
  emp:          d.emp?.name || '',
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

const toArr = (v) => Array.isArray(v) ? v : [];

/** Supplier: frontend → API */
export const toApiSupplier = (f) => ({
  name:             f.name             || '',
  phone:            f.phone            || null,
  email:            f.email            || null,
  cats:             toArr(f.cats),
  areas:            toArr(f.areas),
  company:          f.company          || null,
  tax_code:         f.taxCode          || null,
  workshop_address: f.workshopAddress  || null,
  rating:           f.rating           ?? 0,
  rating_pros:      f.ratingPros       || null,
  rating_cons:      f.ratingCons       || null,
  note:             f.note             || null,
  username:         f.username         || null,
  pass:             f.pass             || null,
});

/** Supplier: API → frontend */
export const fromApiSupplier = (d) => ({
  id:              d.id,
  name:            d.name             || '',
  username:        d.prodUser?.username || '',
  pass:            '',
  phone:           d.phone            || '',
  email:           d.email            || '',
  cats:            toArr(d.cats),
  areas:           toArr(d.areas),
  company:         d.company          || '',
  taxCode:         d.tax_code         || '',
  workshopAddress: d.workshop_address || '',
  rating:          d.rating           ?? 0,
  ratingPros:      d.rating_pros      || '',
  ratingCons:      d.rating_cons      || '',
  note:            d.note             || '',
  createdAt:       d.created_at ? new Date(d.created_at).toISOString() : new Date().toISOString(),
});

/** Order: DB → frontend */
export const fromApiOrder = (d) => {
  const wfStatus = d.status || 'pending_kt';
  const KT_APPROVED_STATUSES = [
    'kt_approved','in_design','design_done',
    'in_production','supplier_sent','in_warehouse','delivered',
  ];
  const ktApproved = KT_APPROVED_STATUSES.includes(wfStatus);
  const ktEntry = (d.workflow || []).find(w => w.to_status === 'kt_approved');
  return {
    id:            d.id,
    code:          d.code,
    customerName:  d.customer_name,
    name:          d.customer_name,
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
    ktApproved,
    ktApprovedBy:  ktEntry?.actor?.name || (ktApproved ? '(KT)' : ''),
    ktApprovedAt:  ktEntry?.created_at  || '',
    ktPaidAmount:  Number(d.kt_paid_amount) || 0,
    ktRejected:    d.kt_rejected    || false,
    ktRejectNote:  d.kt_reject_note || '',
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
    smgrNccName:    d.smgr_ncc_name    || '',
    smgrExpectDate: d.smgr_expect_date || '',
    quycach:        d.quycach          || '',
    diadiem:        d.diadiem          || '',
    khaNang:        d.kha_nang         ?? 50,
    nccQuotePrice:  Number(d.ncc_quote_price) || 0,
    nccQuoteNote:   d.ncc_quote_note   || '',
    nccQuotedBy:    d.ncc_quoted_by    || '',
    nccQuotedAt:    d.ncc_quoted_at    || '',
    defect:         d.defect           || false,
    isDefect:       d.defect           || false,
    defectNote:     d.defect_note      || '',
  };
};

