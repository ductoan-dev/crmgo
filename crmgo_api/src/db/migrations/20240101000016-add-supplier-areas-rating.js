'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('suppliers', 'areas', {
      type: Sequelize.JSON,
      defaultValue: [],
      allowNull: true,
      after: 'rating_cons',
    });
    await queryInterface.addColumn('suppliers', 'rating', {
      type: Sequelize.TINYINT.UNSIGNED,
      defaultValue: 0,
      allowNull: true,
      after: 'areas',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('suppliers', 'areas').catch(() => {});
    await queryInterface.removeColumn('suppliers', 'rating').catch(() => {});
  },
};
