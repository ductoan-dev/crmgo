'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('suppliers', 'company',          { type: Sequelize.STRING(200), allowNull: true });
    await queryInterface.addColumn('suppliers', 'tax_code',         { type: Sequelize.STRING(20),  allowNull: true });
    await queryInterface.addColumn('suppliers', 'workshop_address', { type: Sequelize.TEXT,         allowNull: true });
    await queryInterface.addColumn('suppliers', 'rating_pros',      { type: Sequelize.TEXT,         allowNull: true });
    await queryInterface.addColumn('suppliers', 'rating_cons',      { type: Sequelize.TEXT,         allowNull: true });
  },

  async down(queryInterface) {
    for (const col of ['company', 'tax_code', 'workshop_address', 'rating_pros', 'rating_cons']) {
      await queryInterface.removeColumn('suppliers', col).catch(() => {});
    }
  },
};
