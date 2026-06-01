'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = await queryInterface.describeTable('leads');
    if (!cols.transferred_to_id) {
      await queryInterface.addColumn('leads', 'transferred_to_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      });
      await queryInterface.addIndex('leads', ['transferred_to_id']);
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('leads', 'transferred_to_id');
  },
};
