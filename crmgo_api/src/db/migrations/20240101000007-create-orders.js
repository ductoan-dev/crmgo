'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      code: { type: Sequelize.STRING(20), unique: true },
      type: {
        type: Sequelize.ENUM('in-an', 'thiet-ke', 'lam-mau', 'ban-le'),
        defaultValue: 'in-an',
      },
      status: {
        type: Sequelize.ENUM(
          'pending_kt', 'kt_approved', 'in_design', 'design_done',
          'in_production', 'supplier_sent', 'in_warehouse', 'delivered'
        ),
        defaultValue: 'pending_kt',
      },
      customer_name: { type: Sequelize.STRING(150) },
      total: { type: Sequelize.DECIMAL(15, 0), defaultValue: 0 },
      deposit: { type: Sequelize.DECIMAL(15, 0), defaultValue: 0 },
      note: { type: Sequelize.TEXT },
      deadline: { type: Sequelize.DATE },
      opp_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        references: { model: 'opportunities', key: 'id' },
        onDelete: 'SET NULL',
      },
      quote_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        references: { model: 'quotes', key: 'id' },
        onDelete: 'SET NULL',
      },
      emp_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      business_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        references: { model: 'businesses', key: 'id' },
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('orders', ['emp_id']);
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['opp_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('orders');
  },
};
