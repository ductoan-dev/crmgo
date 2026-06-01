'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_items', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(200), allowNull: false },
      category: {
        type: Sequelize.ENUM(
          'Thiết kế', 'In nhanh', 'Offset', 'Hộp sóng',
          'Hộp mềm', 'Hộp cứng', 'Quà tặng', 'Ấn phẩm khác'
        ),
      },
      qty: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 1 },
      unit_price: { type: Sequelize.DECIMAL(15, 0), defaultValue: 0 },
      total: { type: Sequelize.DECIMAL(15, 0), defaultValue: 0 },
      specs: { type: Sequelize.JSON, defaultValue: {} },
      status: {
        type: Sequelize.ENUM('pending', 'in_design', 'design_done', 'in_production', 'done', 'error'),
        defaultValue: 'pending',
      },
      note: { type: Sequelize.TEXT },
      order_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      supplier_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        references: { model: 'suppliers', key: 'id' },
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('order_items');
  },
};
