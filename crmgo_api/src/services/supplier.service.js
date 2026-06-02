import bcrypt from 'bcrypt';
import { Supplier, User, SupplierOrder, Order } from '../db/models/index.js';

const include = [
  { model: User, as: 'prodUser', attributes: ['id', 'name', 'username'] },
];

export const getAll = () =>
  Supplier.findAll({ include, where: { is_active: true }, order: [['name', 'ASC']] });

export const getById = (id) => Supplier.findByPk(id, { include });

export const create = async (data) => {
  const { username, pass, name, phone, email, cats, areas, company,
          tax_code, workshop_address, rating, rating_pros, rating_cons, note } = data;

  let userId = null;
  if (username && pass) {
    const password_hash = await bcrypt.hash(String(pass), 10);
    const user = await User.create({ username, name: name || username, password_hash, role: 'prod' });
    userId = user.id;
  }

  const supplier = await Supplier.create({
    name, phone: phone || null, email: email || null,
    cats: cats || [], areas: areas || [],
    company: company || null, tax_code: tax_code || null,
    workshop_address: workshop_address || null,
    rating: rating ?? 0,
    rating_pros: rating_pros || null, rating_cons: rating_cons || null,
    note: note || null,
    user_id: userId,
  });

  return Supplier.findByPk(supplier.id, { include });
};

export const update = async (id, data) => {
  const { pass, username, ...supplierData } = data;

  await Supplier.update(supplierData, { where: { id } });

  if (pass) {
    const supplier = await Supplier.findByPk(id);
    if (supplier?.user_id) {
      const password_hash = await bcrypt.hash(String(pass), 10);
      await User.update({ password_hash }, { where: { id: supplier.user_id } });
    }
  }

  return Supplier.findByPk(id, { include });
};

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
