import { Lead, User, Business, Opportunity } from '../db/models/index.js';
import { Op } from 'sequelize';
import { genCode } from '../utils/helpers.js';

const include = [
  { model: User,     as: 'emp',          attributes: ['id', 'name', 'role'] },
  { model: User,     as: 'transferredTo', attributes: ['id', 'name', 'role'] },
  { model: Business, as: 'business',     attributes: ['id', 'name'] },
];

export const getAll = ({ empId, role }) => {
  let where = {};
  if (role === 'mkt') {
    // MKT thấy tất cả lead họ tạo ra (emp_id không thay đổi sau khi transfer)
    where = { emp_id: empId };
  } else if (role === 'sales') {
    // KD thấy lead được giao trực tiếp HOẶC lead MKT chuyển sang
    where = { [Op.or]: [{ emp_id: empId }, { transferred_to_id: empId }] };
  }
  return Lead.findAll({ where, include, order: [['created_at', 'DESC']] });
};

export const getById = (id) => Lead.findByPk(id, { include });

export const create = async (data, empId) => {
  const code = genCode('LEAD');
  return Lead.create({ ...data, code, emp_id: empId });
};

export const update = (id, data) =>
  Lead.update(data, { where: { id } }).then(() => Lead.findByPk(id, { include }));

export const remove = (id) => Lead.destroy({ where: { id } });

// Chuyển lead từ MKT → KD: chỉ set transferred_to_id, giữ nguyên emp_id để MKT vẫn thấy
export const transfer = async (leadId, username) => {
  const kd = await User.findOne({ where: { username, role: 'sales' } });
  if (!kd) throw new Error(`Không tìm thấy nhân viên KD với username "${username}"`);
  await Lead.update({ transferred_to_id: kd.id }, { where: { id: leadId } });
  return Lead.findByPk(leadId, { include });
};

export const convertToOpp = async (leadId, empId, body = {}) => {
  const lead = await Lead.findByPk(leadId);
  if (!lead) throw new Error('Lead không tồn tại');

  // ── 1. Tự động tạo Business (Khách hàng) từ dữ liệu lead ───
  let businessId = lead.business_id;
  let business   = null;

  if (!businessId) {
    business = await Business.create({
      name:       lead.customer_name,
      phone:      lead.phone  || null,
      email:      lead.email  || null,
      note:       `Tự động tạo khi chuyển lead ${lead.code}`,
      created_by: empId,
    });
    businessId = business.id;
    // Gắn lead với business vừa tạo
    await lead.update({ business_id: businessId });
  } else {
    business = await Business.findByPk(businessId);
  }

  // ── 2. Tạo Opportunity liên kết Lead + Business ─────────────
  const opp = await Opportunity.create({
    code:          genCode('OPP'),
    lead_id:       lead.id,
    business_id:   businessId,
    emp_id:        empId,
    customer_name: lead.customer_name,
    status:        0,
    kha_nang:      body.kha_nang ?? 50,
    note:          body.note     || null,
  });

  // ── 3. Đánh dấu Lead đã chuyển ─────────────────────────────
  await lead.update({ contact_status: 'da_chuyen' });

  return { opp, business };
};
