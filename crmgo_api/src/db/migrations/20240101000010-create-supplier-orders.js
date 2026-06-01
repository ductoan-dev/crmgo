'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('supplier_orders', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      items: { type: Sequelize.JSON, defaultValue: [] },
      total: { type: Sequelize.DECIMAL(15, 0), defaultValue: 0 },
      status: {
        type: Sequelize.ENUM('sent', 'confirmed', 'in_production', 'done', 'error'),
        defaultValue: 'sent',
      },
      note: { type: Sequelize.TEXT },
      error_note: { type: Sequelize.TEXT },
      deadline: { type: Sequelize.DATE },
      order_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      supplier_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'suppliers', key: 'id' },
        onDelete: 'RESTRICT',
      },
      sent_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('supplier_orders');
  },
};
