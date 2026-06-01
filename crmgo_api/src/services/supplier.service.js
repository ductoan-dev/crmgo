import { Supplier, User, SupplierOrder, Order } from '../db/models/index.js';

const include = [
  { model: User, as: 'prodUser', attributes: ['id', 'name', 'username'] },
];

export const getAll = () =>
  Supplier.findAll({ include, order: [['name', 'ASC']] });

export const getById = (id) => Supplier.findByPk(id, { include });

export const create = (data) => Supplier.create(data);

export const update = (id, data) =>
  Supplier.update(data, { where: { id } }).then(() => Supplier.findByPk(id, { include }));

export const remove = (id) => Supplier.update({ is_active: false }, { where: { id } });

export const sendOrder = async (orderId, supplierId, sentBy, data) => {
  const so = await SupplierOrder.create({
    ...data,
    order_id: orderId,
    supplier_id: supplierId,
    sent_by: sentBy,
    status: 'sent',
  });
  return SupplierOrder.findByPk(so.id, {
    include: [
      { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
      { model: Order,    as: 'order',    attributes: ['id', 'code'] },
      { model: User,     as: 'sentBy',   attributes: ['id', 'name'] },
    ],
  });
};

export const updateSupplierOrderStatus = (id, status, error_note) =>
  SupplierOrder.update({ status, error_note }, { where: { id } })
    .then(() => SupplierOrder.findByPk(id));
