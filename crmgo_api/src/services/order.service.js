import { Order, OrderItem, OrderWorkflow, Opportunity, Quote, User, Business, Supplier, SupplierOrder } from '../db/models/index.js';
import { genCode } from '../utils/helpers.js';
import { WF_STATUSES } from '../utils/constants.js';

const include = [
  { model: User,        as: 'emp',            attributes: ['id', 'name'] },
  { model: Business,    as: 'business',       attributes: ['id', 'name'] },
  { model: Opportunity, as: 'opportunity',    attributes: ['id', 'code', 'status'] },
  { model: Quote,       as: 'quote',          attributes: ['id', 'version', 'total'] },
  { model: OrderItem,   as: 'items' },
  { model: OrderWorkflow, as: 'workflow',
    include: [{ model: User, as: 'actor', attributes: ['id', 'name', 'role'] }],
    order: [['created_at', 'ASC']],
  },
];

// Quy định role nào được chuyển sang trạng thái nào
const WF_TRANSITIONS = {
  pending_kt:     { to: 'kt_approved',   roles: ['ketoan', 'admin'] },
  kt_approved:    { to: 'in_design',     roles: ['design', 'admin'] },
  in_design:      { to: 'design_done',   roles: ['design', 'admin'] },
  design_done:    { to: 'in_production', roles: ['smgr', 'admin'] },
  in_production:  { to: 'supplier_sent', roles: ['smgr', 'admin'] },
  supplier_sent:  { to: 'in_warehouse',  roles: ['kho', 'prod', 'admin'] },
  in_warehouse:   { to: 'delivered',     roles: ['kho', 'sales', 'admin'] },
};

export const getAll = ({ role, empId }) => {
  const where = role === 'sales' ? { emp_id: empId } : {};
  return Order.findAll({ where, include, order: [['created_at', 'DESC']] });
};

export const getById = (id) => Order.findByPk(id, { include });

export const create = async (data, empId) => {
  const { items = [], ...orderData } = data;
  const code = genCode('ORD');
  const order = await Order.create({ ...orderData, code, emp_id: empId, status: 'pending_kt' });

  if (items.length) {
    const rows = items.map((it) => ({ ...it, order_id: order.id }));
    await OrderItem.bulkCreate(rows);
  }

  await OrderWorkflow.create({
    order_id: order.id,
    actor_id: empId,
    from_status: null,
    to_status: 'pending_kt',
    note: 'Tạo đơn hàng',
  });

  return Order.findByPk(order.id, { include });
};

export const updateStatus = async (orderId, actorId, actorRole, note = '') => {
  const order = await Order.findByPk(orderId);
  if (!order) throw new Error('Đơn hàng không tồn tại');

  const transition = WF_TRANSITIONS[order.status];
  if (!transition) throw new Error('Đơn hàng đã hoàn thành, không thể chuyển tiếp');
  if (!transition.roles.includes(actorRole)) throw new Error('Bạn không có quyền thực hiện bước này');

  const from = order.status;
  const to   = transition.to;

  await order.update({ status: to });
  await OrderWorkflow.create({ order_id: orderId, actor_id: actorId, from_status: from, to_status: to, note });

  return Order.findByPk(orderId, { include });
};

export const update = (id, data) =>
  Order.update(data, { where: { id } }).then(() => Order.findByPk(id, { include }));

// SMGR: giao đơn cho NCC — force set supplier_sent + lưu smgr fields
// Không qua WF_TRANSITIONS vì đây là quyết định quản lý (smgr có quyền assign bất kỳ lúc nào)
export const smgrAssign = async (orderId, actorId, { nccName, expectDate, note }) => {
  const order = await Order.findByPk(orderId);
  if (!order) throw new Error('Đơn hàng không tồn tại');

  const from = order.status;
  const to   = 'supplier_sent';

  await order.update({
    status:           to,
    smgr_ncc_name:    nccName    || null,
    smgr_expect_date: expectDate || null,
  });
  await OrderWorkflow.create({
    order_id: orderId, actor_id: actorId,
    from_status: from, to_status: to,
    note: note || `Giao NCC: ${nccName}`,
  });

  return Order.findByPk(orderId, { include });
};

// KT: ghi nhận thanh toán (cộng dồn vào kt_paid_amount)
export const recordPayment = async (id, amount) => {
  const order = await Order.findByPk(id);
  if (!order) throw new Error('Đơn hàng không tồn tại');
  const newTotal = Number(order.kt_paid_amount || 0) + Number(amount);
  await order.update({ kt_paid_amount: newTotal });
  return Order.findByPk(id, { include });
};

// Prod: cập nhật các field riêng của NCC (quote, defect) — không advance workflow
const PROD_ALLOWED_FIELDS = new Set([
  'ncc_quote_price', 'ncc_quote_note', 'ncc_quoted_by', 'ncc_quoted_at',
  'defect', 'is_defect', 'defect_note',
]);
export const updateProdFields = async (id, data) => {
  const safe = Object.fromEntries(
    Object.entries(data).filter(([k]) => PROD_ALLOWED_FIELDS.has(k))
  );
  if (!Object.keys(safe).length) throw new Error('Không có trường hợp lệ');
  await Order.update(safe, { where: { id } });
  return Order.findByPk(id, { include });
};

// KT: từ chối đơn hàng (không advance workflow, chỉ đánh dấu)
export const rejectOrder = async (id, actorId, reason) => {
  const order = await Order.findByPk(id);
  if (!order) throw new Error('Đơn hàng không tồn tại');
  await order.update({ kt_rejected: true, kt_reject_note: reason || '' });
  await OrderWorkflow.create({
    order_id: id,
    actor_id: actorId,
    from_status: order.status,
    to_status:   order.status,
    note: `KT từ chối: ${reason || '–'}`,
  });
  return Order.findByPk(id, { include });
};
