import sequelize from '../connection.js';

import User          from './User.js';
import Business      from './Business.js';
import Lead          from './Lead.js';
import Opportunity   from './Opportunity.js';
import Quote         from './Quote.js';
import Order         from './Order.js';
import OrderItem     from './OrderItem.js';
import OrderWorkflow from './OrderWorkflow.js';
import Supplier      from './Supplier.js';
import SupplierOrder from './SupplierOrder.js';
import Notification  from './Notification.js';

// ─────────────────────────────────────────────
//  BUSINESS ← User (ai tạo hồ sơ khách hàng)
// ─────────────────────────────────────────────
Business.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Business,   { foreignKey: 'created_by', as: 'businesses' });

// ─────────────────────────────────────────────
//  LEAD ← User (nhân viên phụ trách)
//  LEAD ← Business (lead thuộc công ty nào)
// ─────────────────────────────────────────────
Lead.belongsTo(User,     { foreignKey: 'emp_id',           as: 'emp' });
Lead.belongsTo(User,     { foreignKey: 'transferred_to_id', as: 'transferredTo' });
Lead.belongsTo(Business, { foreignKey: 'business_id',       as: 'business' });

User.hasMany(Lead,     { foreignKey: 'emp_id',      as: 'leads' });
Business.hasMany(Lead, { foreignKey: 'business_id', as: 'leads' });

// ─────────────────────────────────────────────
//  OPPORTUNITY ← Lead (chuyển đổi từ lead)
//  OPPORTUNITY ← Business
//  OPPORTUNITY ← User (nhân viên phụ trách)
// ─────────────────────────────────────────────
Opportunity.belongsTo(Lead,     { foreignKey: 'lead_id',     as: 'lead' });
Opportunity.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });
Opportunity.belongsTo(User,     { foreignKey: 'emp_id',      as: 'emp' });

Lead.hasMany(Opportunity,     { foreignKey: 'lead_id',     as: 'opportunities' });
Business.hasMany(Opportunity, { foreignKey: 'business_id', as: 'opportunities' });
User.hasMany(Opportunity,     { foreignKey: 'emp_id',      as: 'opportunities' });

// ─────────────────────────────────────────────
//  QUOTE ← Opportunity (báo giá cho cơ hội nào)
//  QUOTE ← User (ai tạo báo giá)
// ─────────────────────────────────────────────
Quote.belongsTo(Opportunity, { foreignKey: 'opp_id',     as: 'opportunity' });
Quote.belongsTo(User,        { foreignKey: 'created_by', as: 'createdBy' });

Opportunity.hasMany(Quote, { foreignKey: 'opp_id',     as: 'quotes' });
User.hasMany(Quote,        { foreignKey: 'created_by', as: 'quotes' });

// ─────────────────────────────────────────────
//  ORDER ← Opportunity (chốt đơn từ cơ hội)
//  ORDER ← Quote (dùng báo giá nào)
//  ORDER ← User (sales tạo đơn)
//  ORDER ← Business (khách hàng)
// ─────────────────────────────────────────────
Order.belongsTo(Opportunity, { foreignKey: 'opp_id',      as: 'opportunity' });
Order.belongsTo(Quote,       { foreignKey: 'quote_id',    as: 'quote' });
Order.belongsTo(User,        { foreignKey: 'emp_id',      as: 'emp' });
Order.belongsTo(Business,    { foreignKey: 'business_id', as: 'business' });

Opportunity.hasMany(Order, { foreignKey: 'opp_id',      as: 'orders' });
Quote.hasMany(Order,       { foreignKey: 'quote_id',    as: 'orders' });
User.hasMany(Order,        { foreignKey: 'emp_id',      as: 'orders' });
Business.hasMany(Order,    { foreignKey: 'business_id', as: 'orders' });

// ─────────────────────────────────────────────
//  ORDER ITEM ← Order (sản phẩm trong đơn)
//  ORDER ITEM ← Supplier (NCC được giao xử lý item)
// ─────────────────────────────────────────────
OrderItem.belongsTo(Order,    { foreignKey: 'order_id',    as: 'order' });
OrderItem.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

Order.hasMany(OrderItem,    { foreignKey: 'order_id',    as: 'items' });
Supplier.hasMany(OrderItem, { foreignKey: 'supplier_id', as: 'orderItems' });

// ─────────────────────────────────────────────
//  ORDER WORKFLOW ← Order (lịch sử chuyển trạng thái)
//  ORDER WORKFLOW ← User (ai thực hiện bước đó)
// ─────────────────────────────────────────────
OrderWorkflow.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
OrderWorkflow.belongsTo(User,  { foreignKey: 'actor_id', as: 'actor' });

Order.hasMany(OrderWorkflow, { foreignKey: 'order_id', as: 'workflow' });
User.hasMany(OrderWorkflow,  { foreignKey: 'actor_id', as: 'workflowActions' });

// ─────────────────────────────────────────────
//  SUPPLIER ← User (tài khoản prod của NCC)
// ─────────────────────────────────────────────
Supplier.belongsTo(User, { foreignKey: 'user_id', as: 'prodUser' });
User.hasOne(Supplier,    { foreignKey: 'user_id', as: 'supplier' });

// ─────────────────────────────────────────────
//  SUPPLIER ORDER ← Order (đơn hàng gốc)
//  SUPPLIER ORDER ← Supplier (NCC nhận đơn)
//  SUPPLIER ORDER ← User (smgr gửi đơn)
// ─────────────────────────────────────────────
SupplierOrder.belongsTo(Order,    { foreignKey: 'order_id',    as: 'order' });
SupplierOrder.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
SupplierOrder.belongsTo(User,     { foreignKey: 'sent_by',     as: 'sentBy' });

Order.hasMany(SupplierOrder,    { foreignKey: 'order_id',    as: 'supplierOrders' });
Supplier.hasMany(SupplierOrder, { foreignKey: 'supplier_id', as: 'supplierOrders' });
User.hasMany(SupplierOrder,     { foreignKey: 'sent_by',     as: 'sentSupplierOrders' });

// ─────────────────────────────────────────────
//  NOTIFICATION ← User (người nhận thông báo)
// ─────────────────────────────────────────────
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'recipient' });
User.hasMany(Notification,   { foreignKey: 'user_id', as: 'notifications' });

// ─────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────
export {
  sequelize,
  User,
  Business,
  Lead,
  Opportunity,
  Quote,
  Order,
  OrderItem,
  OrderWorkflow,
  Supplier,
  SupplierOrder,
  Notification,
};
