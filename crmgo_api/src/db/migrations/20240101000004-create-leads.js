'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leads', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      code: { type: Sequelize.STRING(20), unique: true },
      customer_name: { type: Sequelize.STRING(150), allowNull: false },
      phone: { type: Sequelize.STRING(20) },
      email: { type: Sequelize.STRING(100) },
      contact_status: {
        type: Sequelize.ENUM('chua_lh', 'da_lh', 'dat_hen', 'ko_nghe', 'ko_trien', 'da_chuyen'),
        defaultValue: 'chua_lh',
      },
      temperature: {
        type: Sequelize.ENUM('hot', 'warm', 'cold'),
        defaultValue: 'warm',
      },
      source: { type: Sequelize.STRING(100) },
      note: { type: Sequelize.TEXT },
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

    await queryInterface.addIndex('leads', ['emp_id']);
    await queryInterface.addIndex('leads', ['contact_status']);
    await queryInterface.addIndex('leads', ['temperature']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('leads');
  },
};
