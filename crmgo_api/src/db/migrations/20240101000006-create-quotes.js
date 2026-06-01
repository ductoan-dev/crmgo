'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('quotes', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      items: { type: Sequelize.JSON, defaultValue: [] },
      total: { type: Sequelize.DECIMAL(15, 0), defaultValue: 0 },
      note: { type: Sequelize.TEXT },
      version: { type: Sequelize.TINYINT.UNSIGNED, defaultValue: 1 },
      opp_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'opportunities', key: 'id' },
        onDelete: 'CASCADE',
      },
      created_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('quotes');
  },
};
