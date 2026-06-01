'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('opportunities', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      code: { type: Sequelize.STRING(20), unique: true },
      customer_name: { type: Sequelize.STRING(150) },
      status: { type: Sequelize.TINYINT.UNSIGNED, defaultValue: 0 },
      kha_nang: { type: Sequelize.TINYINT.UNSIGNED, defaultValue: 50 },
      images: { type: Sequelize.JSON, defaultValue: [] },
      note: { type: Sequelize.TEXT },
      emp_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      lead_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        references: { model: 'leads', key: 'id' },
        onDelete: 'SET NULL',
      },
      business_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        references: { model: 'businesses', key: 'id' },
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('opportunities', ['emp_id']);
    await queryInterface.addIndex('opportunities', ['status']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('opportunities');
  },
};
