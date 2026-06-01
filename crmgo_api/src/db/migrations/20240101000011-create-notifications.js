'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      type: { type: Sequelize.STRING(50) },
      title: { type: Sequelize.STRING(200), allowNull: false },
      message: { type: Sequelize.TEXT },
      ref_type: { type: Sequelize.STRING(20) },
      ref_id: { type: Sequelize.INTEGER.UNSIGNED },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['is_read']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  },
};
