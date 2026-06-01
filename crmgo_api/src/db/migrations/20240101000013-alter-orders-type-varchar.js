'use strict';

// Đổi orders.type từ ENUM('in-an','thiet-ke','lam-mau','ban-le')
// sang VARCHAR(100) để chấp nhận CATS values ('In nhanh', 'Offset', ...)
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('orders', 'type', {
      type: Sequelize.STRING(100),
      defaultValue: 'In nhanh',
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('orders', 'type', {
      type: Sequelize.ENUM('in-an', 'thiet-ke', 'lam-mau', 'ban-le'),
      defaultValue: 'in-an',
    });
  },
};
